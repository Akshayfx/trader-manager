//+------------------------------------------------------------------+
//|                                      ChartWise_Manager.mq4       |
//|                        ChartWise Trade Manager for MT4           |
//|                        Supports Multiple Terminals (Magic Keys)  |
//|                        Version 3.0                               |
//+------------------------------------------------------------------+
#property copyright "ChartWise"
#property link      "https://chartwise.app"
#property version   "3.00"
#property strict

// Input Parameters
input string   MagicKey = "CHARTWISE_001";    // Magic Key (unique per terminal)
input string   ServerURL = "ws://localhost:3001";  // WebSocket Server URL
input bool     AutoConnect = true;            // Auto-connect on startup
input bool     AllowDLL = true;               // Allow DLL imports (required)
input int      ReconnectInterval = 5000;      // Reconnect interval (ms)
input bool     DebugMode = false;             // Enable debug logging

// Global Variables
int      g_socket = INVALID_HANDLE;
bool     g_connected = false;
datetime g_lastPing = 0;
datetime g_lastReconnect = 0;
string   g_clientId = "";

// Partial TP tracking - PRICE BASED (Magic Keys style)
struct TPLevel {
   int      level;
   double   price;        // Price-based trigger (not pips)
   double   percent;
   bool     triggered;
};

TPLevel  g_tpLevels[10];
int      g_tpLevelCount = 0;

// Visual line objects
string   g_slLineName = "ChartWise_SL_Line";
string   g_tpLineName = "ChartWise_TP_Line";
string   g_entryLineName = "ChartWise_Entry_Line";
string   g_ptpLinePrefix = "ChartWise_PTP_";

// Line colors
color    g_slLineColor = clrRed;
color    g_tpLineColor = clrGreen;
color    g_entryLineColor = clrBlue;
color    g_ptpLineColor = clrPurple;

// Lot size display
double   g_currentLotSize = 0;
string   g_lotSizeLabelName = "ChartWise_LotSize_Label";

// Pip counter display
string   g_pipCounterName = "ChartWise_PipCounter";
double   g_entryPrice = 0;
int      g_tradeTicket = 0;

// Pip value calculation per symbol
double   g_pipSize = 0.0001;      // Default for forex
double   g_pipValue = 10;         // $10 per pip per lot (default)
int      g_symbolDigits = 4;      // Decimal places

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   g_clientId = GenerateClientId();
   
   Print("========================================");
   Print("ChartWise Manager v3.0");
   Print("Magic Key: ", MagicKey);
   Print("Client ID: ", g_clientId);
   Print("Symbol: ", Symbol());
   Print("========================================");
   
   if(!AllowDLL)
   {
      Alert("ERROR: DLL imports must be enabled!");
      return(INIT_FAILED);
   }
   
   // Calculate pip values for this symbol
   CalculatePipValues();
   
   if(AutoConnect)
   {
      ConnectToServer();
   }
   
   EventSetTimer(1);
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Calculate pip values based on symbol                             |
//+------------------------------------------------------------------+
void CalculatePipValues()
{
   string symbol = Symbol();
   
   // XAUUSD (Gold) - 1 USD move = 10 pips, pip size = 0.1
   if(StringFind(symbol, "XAU") != -1 || StringFind(symbol, "GOLD") != -1)
   {
      g_pipSize = 0.1;
      g_pipValue = 1;  // $1 per pip for 0.01 lot
      g_symbolDigits = 1;
   }
   // XAGUSD (Silver)
   else if(StringFind(symbol, "XAG") != -1 || StringFind(symbol, "SILVER") != -1)
   {
      g_pipSize = 0.01;
      g_pipValue = 1;
      g_symbolDigits = 2;
   }
   // JPY pairs - pip is 0.01 (2nd decimal)
   else if(StringFind(symbol, "JPY") != -1)
   {
      g_pipSize = 0.01;
      g_pipValue = 10;  // $10 per pip per lot
      g_symbolDigits = 2;
   }
   // Crypto pairs
   else if(StringFind(symbol, "BTC") != -1 || StringFind(symbol, "ETH") != -1)
   {
      g_pipSize = 1;
      g_pipValue = 1;
      g_symbolDigits = 0;
   }
   // Default forex pairs
   else
   {
      g_pipSize = 0.0001;
      g_pipValue = 10;  // $10 per pip per lot
      g_symbolDigits = 4;
   }
   
   Print("Pip Size: ", g_pipSize, " | Pip Value: $", g_pipValue, " per lot");
}

//+------------------------------------------------------------------+
//| Calculate pips between two prices                                |
//+------------------------------------------------------------------+
double CalculatePips(double price1, double price2)
{
   return MathAbs(price1 - price2) / g_pipSize;
}

//+------------------------------------------------------------------+
//| Format price based on symbol digits                              |
//+------------------------------------------------------------------+
string FormatPrice(double price)
{
   return DoubleToString(price, g_symbolDigits);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
   DisconnectFromServer();
   Print("ChartWise Manager stopped");
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   if(!g_connected && AutoConnect)
   {
      if(TimeCurrent() - g_lastReconnect > ReconnectInterval / 1000)
      {
         ConnectToServer();
         g_lastReconnect = TimeCurrent();
      }
   }
   
   if(g_connected && TimeCurrent() - g_lastPing > 5)
   {
      SendAccountStatus();
      SendPositionStatus();
      SendMarketData();
      CheckPartialTPTriggers();
      CheckLineDrag();
      g_lastPing = TimeCurrent();
   }
   
   // Always update pip counter
   UpdatePipCounter();
}

//+------------------------------------------------------------------+
//| Timer function                                                   |
//+------------------------------------------------------------------+
void OnTimer()
{
   if(g_connected)
   {
      ReceiveMessages();
   }
}

//+------------------------------------------------------------------+
//| Connect to WebSocket server                                      |
//+------------------------------------------------------------------+
void ConnectToServer()
{
   if(g_connected) return;
   
   Print("Connecting to ChartWise server...");
   
   g_socket = SocketCreate();
   
   if(g_socket == INVALID_HANDLE)
   {
      Print("ERROR: Failed to create socket");
      return;
   }
   
   string host = "localhost";
   int port = 3001;
   
   if(StringFind(ServerURL, "://") != -1)
   {
      int start = StringFind(ServerURL, "://") + 3;
      int colon = StringFind(ServerURL, ":", start);
      if(colon != -1)
      {
         host = StringSubstr(ServerURL, start, colon - start);
         port = (int)StringToInteger(StringSubstr(ServerURL, colon + 1));
      }
   }
   
   if(!SocketConnect(g_socket, host, port, 5000))
   {
      Print("ERROR: Failed to connect to server");
      SocketClose(g_socket);
      g_socket = INVALID_HANDLE;
      return;
   }
   
   if(!WebSocketHandshake(host, port))
   {
      Print("ERROR: WebSocket handshake failed");
      SocketClose(g_socket);
      g_socket = INVALID_HANDLE;
      return;
   }
   
   g_connected = true;
   Print("Connected to ChartWise server!");
   
   string connectMsg = "{" +
      "\"type\":\"mt.connect\"," +
      "\"clientId\":\"" + g_clientId + "\"," +
      "\"data\":{" +
         "\"version\":\"MT4\"," +
         "\"magicKey\":\"" + MagicKey + "\"," +
         "\"accountInfo\":{" +
            "\"accountNumber\":" + IntegerToString(AccountNumber()) + "," +
            "\"accountName\":\"" + AccountName() + "\"," +
            "\"balance\":" + DoubleToString(AccountBalance(), 2) + "," +
            "\"equity\":" + DoubleToString(AccountEquity(), 2) +
         "}" +
      "}" +
   "}";
   
   SendMessage(connectMsg);
   Comment("ChartWise Connected [", MagicKey, "]");
}

//+------------------------------------------------------------------+
//| WebSocket handshake                                              |
//+------------------------------------------------------------------+
bool WebSocketHandshake(string host, int port)
{
   string request = 
      "GET / HTTP/1.1\r\n" +
      "Host: " + host + ":" + IntegerToString(port) + "\r\n" +
      "Upgrade: websocket\r\n" +
      "Connection: Upgrade\r\n" +
      "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n" +
      "Sec-WebSocket-Version: 13\r\n" +
      "X-Client-Type: mt4\r\n" +
      "X-Magic-Key: " + MagicKey + "\r\n" +
      "\r\n";
   
   char req[];
   StringToCharArray(request, req);
   int sent = SocketSend(g_socket, req, ArraySize(req));
   
   if(sent <= 0) return false;
   
   char response[1024];
   int received = SocketRead(g_socket, response, 1024, 5000);
   
   if(received <= 0) return false;
   
   string resp = CharArrayToString(response, 0, received);
   
   return StringFind(resp, "101 Switching Protocols") != -1;
}

//+------------------------------------------------------------------+
//| Disconnect from server                                           |
//+------------------------------------------------------------------+
void DisconnectFromServer()
{
   if(g_connected)
   {
      string disconnectMsg = "{\"type\":\"mt.disconnect\",\"clientId\":\"" + g_clientId + "\"}";
      SendMessage(disconnectMsg);
      g_connected = false;
   }
   
   if(g_socket != INVALID_HANDLE)
   {
      SocketClose(g_socket);
      g_socket = INVALID_HANDLE;
   }
   
   Comment("");
}

//+------------------------------------------------------------------+
//| Send message to server                                           |
//+------------------------------------------------------------------+
void SendMessage(string message)
{
   if(!g_connected || g_socket == INVALID_HANDLE) return;
   
   char frame[];
   BuildWebSocketFrame(message, frame);
   
   int sent = SocketSend(g_socket, frame, ArraySize(frame));
   
   if(sent <= 0)
   {
      g_connected = false;
   }
   
   if(DebugMode) Print("SENT: ", message);
}

//+------------------------------------------------------------------+
//| Build WebSocket text frame                                       |
//+------------------------------------------------------------------+
void BuildWebSocketFrame(string message, char &frame[])
{
   char msg[];
   StringToCharArray(message, msg);
   int msgLen = StringLen(message);
   
   if(msgLen < 126)
   {
      ArrayResize(frame, msgLen + 2);
      frame[0] = 0x81;
      frame[1] = (char)msgLen;
      ArrayCopy(frame, msg, 2, 0, msgLen);
   }
   else if(msgLen < 65536)
   {
      ArrayResize(frame, msgLen + 4);
      frame[0] = 0x81;
      frame[1] = 126;
      frame[2] = (char)(msgLen >> 8);
      frame[3] = (char)(msgLen & 0xFF);
      ArrayCopy(frame, msg, 4, 0, msgLen);
   }
}

//+------------------------------------------------------------------+
//| Receive and process messages                                     |
//+------------------------------------------------------------------+
void ReceiveMessages()
{
   if(!g_connected || g_socket == INVALID_HANDLE) return;
   
   char buffer[4096];
   int received = SocketRead(g_socket, buffer, 4096, 100);
   
   if(received > 0)
   {
      string message = ParseWebSocketFrame(buffer, received);
      if(StringLen(message) > 0)
      {
         if(DebugMode) Print("RECV: ", message);
         ProcessMessage(message);
      }
   }
   else if(received == -1)
   {
      g_connected = false;
      Comment("ChartWise Disconnected");
   }
}

//+------------------------------------------------------------------+
//| Parse WebSocket frame                                            |
//+------------------------------------------------------------------+
string ParseWebSocketFrame(char &buffer[], int len)
{
   if(len < 2) return "";
   
   if((buffer[0] & 0x0F) != 1) return "";
   
   int payloadLen = buffer[1] & 0x7F;
   int maskOffset = 2;
   
   if(payloadLen == 126)
   {
      payloadLen = (buffer[2] << 8) | buffer[3];
      maskOffset = 4;
   }
   else if(payloadLen == 127) return "";
   
   bool masked = (buffer[1] & 0x80) != 0;
   
   char mask[4];
   if(masked)
   {
      mask[0] = buffer[maskOffset];
      mask[1] = buffer[maskOffset + 1];
      mask[2] = buffer[maskOffset + 2];
      mask[3] = buffer[maskOffset + 3];
      maskOffset += 4;
   }
   
   char payload[];
   ArrayResize(payload, payloadLen);
   
   for(int i = 0; i < payloadLen; i++)
   {
      payload[i] = masked ? buffer[maskOffset + i] ^ mask[i % 4] : buffer[maskOffset + i];
   }
   
   return CharArrayToString(payload);
}

//+------------------------------------------------------------------+
//| Process incoming message                                         |
//+------------------------------------------------------------------+
void ProcessMessage(string message)
{
   string type = GetJsonValue(message, "type");
   
   if(type == "execute_trade" || type == "open_trade") ExecuteTradeFromMessage(message);
   else if(type == "plan_trade") HandlePlanTrade(message);
   else if(type == "close_trade") CloseTradeFromMessage(message);
   else if(type == "partial_close") PartialCloseFromMessage(message);
   else if(type == "custom_close") CustomCloseFromMessage(message);
   else if(type == "modify_sl") ModifySLFromMessage(message);
   else if(type == "modify_tp") ModifyTPFromMessage(message);
   else if(type == "close_all") CloseAllTrades();
   else if(type == "close_half") CloseHalfPositions();
   else if(type == "sl_to_be") MoveSLToBreakeven();
   else if(type == "auto_be") HandleAutoBE(message);
   else if(type == "set_partial_tp") SetPartialTPLevels(message);
   else if(type == "pending_orders") HandlePendingOrders();
   else if(type == "trade.draw_line") DrawLineFromMessage(message);
   else if(type == "trade.clear_lines") ClearAllLines();
   else if(type == "trade.update_lotsize") UpdateLotSizeDisplay(message);
   else if(type == "trade.clear_ptp_lines") ClearPartialTPLines();
   else if(type == "ping") SendMessage("{\"type\":\"pong\",\"timestamp\":" + IntegerToString(TimeCurrent()) + "}");
}

//+------------------------------------------------------------------+
//| Handle plan trade                                                |
//+------------------------------------------------------------------+
void HandlePlanTrade(string message)
{
   string data = GetJsonObject(message, "data");
   
   string symbol = GetJsonValue(data, "symbol");
   string direction = GetJsonValue(data, "direction");
   string entryType = GetJsonValue(data, "entryType");
   double stopLoss = StringToDouble(GetJsonValue(data, "stopLoss"));
   double takeProfit = StringToDouble(GetJsonValue(data, "takeProfit"));
   double riskPercent = StringToDouble(GetJsonValue(data, "riskPercent"));
   
   Print("Trade planned: ", symbol, " ", direction, " SL:", stopLoss, " TP:", takeProfit);
   
   SendMessage("{" +
      "\"type\":\"trade.planned\"," +
      "\"data\":{" +
         "\"symbol\":\"" + symbol + "\"," +
         "\"direction\":\"" + direction + "\"," +
         "\"stopLoss\":" + DoubleToString(stopLoss, 5) + "," +
         "\"takeProfit\":" + DoubleToString(takeProfit, 5) +
      "}" +
   "}");
}

//+------------------------------------------------------------------+
//| Execute trade from message                                       |
//+------------------------------------------------------------------+
void ExecuteTradeFromMessage(string message)
{
   string data = GetJsonObject(message, "data");
   
   string symbol = GetJsonValue(data, "symbol");
   string orderType = GetJsonValue(data, "direction");
   double lotSize = StringToDouble(GetJsonValue(data, "lotSize"));
   double stopLoss = StringToDouble(GetJsonValue(data, "stopLoss"));
   double takeProfit = StringToDouble(GetJsonValue(data, "takeProfit"));
   
   if(StringLen(symbol) == 0 || symbol == "AUTO") symbol = Symbol();
   if(lotSize <= 0) lotSize = 0.01;
   
   int cmd = (orderType == "sell" || orderType == "SELL") ? ORDER_TYPE_SELL : ORDER_TYPE_BUY;
   double price = (cmd == ORDER_TYPE_BUY) ? Ask : Bid;
   
   double sl = 0, tp = 0;
   if(stopLoss > 0)
   {
      sl = (cmd == ORDER_TYPE_BUY) ? price - stopLoss * Point : price + stopLoss * Point;
   }
   if(takeProfit > 0)
   {
      tp = (cmd == ORDER_TYPE_BUY) ? price + takeProfit * Point : price - takeProfit * Point;
   }
   
   int ticket = OrderSend(symbol, cmd, lotSize, price, 3, sl, tp, "ChartWise", StringToInteger(MagicKey), 0, clrGreen);
   
   if(ticket > 0)
   {
      Print("Trade executed: #", ticket);
      SendTradeConfirmation(ticket, "executed");
   }
   else
   {
      Print("ERROR: Trade failed - ", GetLastError());
      SendTradeError("Failed to execute trade");
   }
}

//+------------------------------------------------------------------+
//| Custom close from message                                        |
//+------------------------------------------------------------------+
void CustomCloseFromMessage(string message)
{
   string data = GetJsonObject(message, "data");
   double percent = StringToDouble(GetJsonValue(data, "percent"));
   
   if(percent <= 0 || percent > 100) return;
   
   int total = OrdersTotal();
   int closed = 0;
   
   for(int i = total - 1; i >= 0; i--)
   {
      if(OrderSelect(i, SELECT_BY_POS))
      {
         if(OrderMagicNumber() == StringToInteger(MagicKey) || OrderMagicNumber() == 0)
         {
            double closeLots = NormalizeDouble(OrderLots() * percent / 100, 2);
            if(closeLots > 0)
            {
               double price = (OrderType() == ORDER_TYPE_BUY) ? Bid : Ask;
               if(OrderClose(OrderTicket(), closeLots, price, 3, clrOrange))
               {
                  closed++;
               }
            }
         }
      }
   }
   
   Print("Custom close: ", percent, "% - ", closed, " positions affected");
   SendMessage("{\"type\":\"custom_close_complete\",\"data\":{\"percent\":" + DoubleToString(percent, 0) + ",\"closed\":" + IntegerToString(closed) + "}}");
}

//+------------------------------------------------------------------+
//| Set partial TP levels                                            |
//+------------------------------------------------------------------+
void SetPartialTPLevels(string message)
{
   string data = GetJsonObject(message, "data");
   string levelsStr = GetJsonValue(data, "levels");
   
   // Parse levels array (simplified)
   g_tpLevelCount = 0;
   
   // Default levels if parsing fails
   g_tpLevels[0].level = 1; g_tpLevels[0].pips = 30; g_tpLevels[0].percent = 50; g_tpLevels[0].triggered = false;
   g_tpLevels[1].level = 2; g_tpLevels[1].pips = 50; g_tpLevels[1].percent = 30; g_tpLevels[1].triggered = false;
   g_tpLevels[2].level = 3; g_tpLevels[2].pips = 80; g_tpLevels[2].percent = 20; g_tpLevels[2].triggered = false;
   g_tpLevelCount = 3;
   
   Print("Partial TP levels set: ", g_tpLevelCount, " levels");
   SendMessage("{\"type\":\"partial_tp_set\",\"data\":{\"count\":" + IntegerToString(g_tpLevelCount) + "}}");
}

//+------------------------------------------------------------------+
//| Check partial TP triggers                                        |
//+------------------------------------------------------------------+
void CheckPartialTPTriggers()
{
   if(g_tpLevelCount == 0) return;
   
   int total = OrdersTotal();
   
   for(int i = 0; i < total; i++)
   {
      if(OrderSelect(i, SELECT_BY_POS))
      {
         if(OrderMagicNumber() == StringToInteger(MagicKey) || OrderMagicNumber() == 0)
         {
            double openPrice = OrderOpenPrice();
            double currentPrice = (OrderType() == ORDER_TYPE_BUY) ? Bid : Ask;
            double pipsMoved = MathAbs(currentPrice - openPrice) / Point / 10;
            
            for(int j = 0; j < g_tpLevelCount; j++)
            {
               if(!g_tpLevels[j].triggered && pipsMoved >= g_tpLevels[j].pips)
               {
                  // Trigger partial close
                  double closeLots = NormalizeDouble(OrderLots() * g_tpLevels[j].percent / 100, 2);
                  if(closeLots > 0)
                  {
                     double price = (OrderType() == ORDER_TYPE_BUY) ? Bid : Ask;
                     if(OrderClose(OrderTicket(), closeLots, price, 3, clrPurple))
                     {
                        g_tpLevels[j].triggered = true;
                        Print("Partial TP triggered: Level ", j + 1, " - ", g_tpLevels[j].percent, "% closed");
                        
                        SendMessage("{" +
                           "\"type\":\"partial_tp_triggered\"," +
                           "\"data\":{" +
                              "\"level\":" + IntegerToString(j + 1) + "," +
                              "\"pips\":" + DoubleToString(g_tpLevels[j].pips, 0) + "," +
                              "\"percent\":" + DoubleToString(g_tpLevels[j].percent, 0) +
                           "}" +
                        "}");
                     }
                  }
               }
            }
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Handle auto BE                                                   |
//+------------------------------------------------------------------+
void HandleAutoBE(string message)
{
   string data = GetJsonObject(message, "data");
   bool enabled = GetJsonValue(data, "enabled") == "true";
   
   Print("Auto BE ", enabled ? "enabled" : "disabled");
   
   if(enabled)
   {
      // Set up auto BE monitoring
      SendMessage("{\"type\":\"auto_be_enabled\"}");
   }
}

//+------------------------------------------------------------------+
//| Handle pending orders                                            |
//+------------------------------------------------------------------+
void HandlePendingOrders()
{
   int total = OrdersTotal();
   int pendingCount = 0;
   
   for(int i = 0; i < total; i++)
   {
      if(OrderSelect(i, SELECT_BY_POS))
      {
         if(OrderType() > 1) // Pending order types
         {
            pendingCount++;
         }
      }
   }
   
   Print("Pending orders: ", pendingCount);
   SendMessage("{\"type\":\"pending_orders_info\",\"data\":{\"count\":" + IntegerToString(pendingCount) + "}}");
}

//+------------------------------------------------------------------+
//| Close trade from message                                         |
//+------------------------------------------------------------------+
void CloseTradeFromMessage(string message)
{
   string data = GetJsonObject(message, "data");
   int ticket = (int)StringToInteger(GetJsonValue(data, "ticket"));
   
   if(ticket <= 0)
   {
      CloseAllTrades();
      return;
   }
   
   if(OrderSelect(ticket, SELECT_BY_TICKET))
   {
      if(OrderCloseTime() == 0)
      {
         double price = (OrderType() == ORDER_TYPE_BUY) ? Bid : Ask;
         bool result = OrderClose(ticket, OrderLots(), price, 3, clrRed);
         
         if(result)
         {
            Print("Trade closed: #", ticket);
            SendTradeConfirmation(ticket, "closed");
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Partial close from message                                       |
//+------------------------------------------------------------------+
void PartialCloseFromMessage(string message)
{
   string data = GetJsonObject(message, "data");
   int ticket = (int)StringToInteger(GetJsonValue(data, "ticket"));
   double percent = StringToDouble(GetJsonValue(data, "percent"));
   
   if(ticket <= 0 || percent <= 0) return;
   
   if(OrderSelect(ticket, SELECT_BY_TICKET))
   {
      if(OrderCloseTime() == 0)
      {
         double closeLots = NormalizeDouble(OrderLots() * percent / 100, 2);
         double price = (OrderType() == ORDER_TYPE_BUY) ? Bid : Ask;
         
         bool result = OrderClose(ticket, closeLots, price, 3, clrOrange);
         
         if(result)
         {
            Print("Partial close: #", ticket, " ", percent, "%");
            SendTradeConfirmation(ticket, "partial_closed");
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Modify stop loss from message                                    |
//+------------------------------------------------------------------+
void ModifySLFromMessage(string message)
{
   string data = GetJsonObject(message, "data");
   int ticket = (int)StringToInteger(GetJsonValue(data, "ticket"));
   double newSL = StringToDouble(GetJsonValue(data, "newSL"));
   
   if(ticket <= 0) return;
   
   if(OrderSelect(ticket, SELECT_BY_TICKET))
   {
      if(OrderCloseTime() == 0)
      {
         bool result = OrderModify(ticket, OrderOpenPrice(), newSL, OrderTakeProfit(), 0, clrBlue);
         if(result) Print("SL modified: #", ticket, " -> ", newSL);
      }
   }
}

//+------------------------------------------------------------------+
//| Modify take profit from message                                  |
//+------------------------------------------------------------------+
void ModifyTPFromMessage(string message)
{
   string data = GetJsonObject(message, "data");
   int ticket = (int)StringToInteger(GetJsonValue(data, "ticket"));
   double newTP = StringToDouble(GetJsonValue(data, "newTP"));
   
   if(ticket <= 0) return;
   
   if(OrderSelect(ticket, SELECT_BY_TICKET))
   {
      if(OrderCloseTime() == 0)
      {
         bool result = OrderModify(ticket, OrderOpenPrice(), OrderStopLoss(), newTP, 0, clrBlue);
         if(result) Print("TP modified: #", ticket, " -> ", newTP);
      }
   }
}

//+------------------------------------------------------------------+
//| Close all trades                                                 |
//+------------------------------------------------------------------+
void CloseAllTrades()
{
   int total = OrdersTotal();
   int closed = 0;
   
   for(int i = total - 1; i >= 0; i--)
   {
      if(OrderSelect(i, SELECT_BY_POS))
      {
         if(OrderMagicNumber() == StringToInteger(MagicKey) || OrderMagicNumber() == 0)
         {
            double price = (OrderType() == ORDER_TYPE_BUY) ? Bid : Ask;
            if(OrderClose(OrderTicket(), OrderLots(), price, 3, clrRed))
            {
               closed++;
            }
         }
      }
   }
   
   Print("Closed ", closed, " trades");
   SendMessage("{\"type\":\"trade_closed_all\",\"data\":{\"count\":" + IntegerToString(closed) + "}}");
}

//+------------------------------------------------------------------+
//| Close half positions                                             |
//+------------------------------------------------------------------+
void CloseHalfPositions()
{
   int total = OrdersTotal();
   int closed = 0;
   
   for(int i = total - 1; i >= 0; i--)
   {
      if(OrderSelect(i, SELECT_BY_POS))
      {
         if(OrderMagicNumber() == StringToInteger(MagicKey) || OrderMagicNumber() == 0)
         {
            double closeLots = NormalizeDouble(OrderLots() / 2, 2);
            double price = (OrderType() == ORDER_TYPE_BUY) ? Bid : Ask;
            if(OrderClose(OrderTicket(), closeLots, price, 3, clrOrange))
            {
               closed++;
            }
         }
      }
   }
   
   Print("Closed 50% of ", closed, " positions");
   SendMessage("{\"type\":\"close_half_complete\",\"data\":{\"count\":" + IntegerToString(closed) + "}}");
}

//+------------------------------------------------------------------+
//| Move stop loss to breakeven                                      |
//+------------------------------------------------------------------+
void MoveSLToBreakeven()
{
   int total = OrdersTotal();
   int modified = 0;
   
   for(int i = total - 1; i >= 0; i--)
   {
      if(OrderSelect(i, SELECT_BY_POS))
      {
         if(OrderMagicNumber() == StringToInteger(MagicKey) || OrderMagicNumber() == 0)
         {
            double bePrice = OrderOpenPrice();
            double currentSL = OrderStopLoss();
            
            if((OrderType() == ORDER_TYPE_BUY && (currentSL < bePrice || currentSL == 0)) ||
               (OrderType() == ORDER_TYPE_SELL && (currentSL > bePrice || currentSL == 0)))
            {
               if(OrderModify(OrderTicket(), bePrice, bePrice, OrderTakeProfit(), 0, clrGreen))
               {
                  modified++;
               }
            }
         }
      }
   }
   
   Print("Moved ", modified, " positions to breakeven");
   SendMessage("{\"type\":\"sl_to_be_complete\",\"data\":{\"count\":" + IntegerToString(modified) + "}}");
}

//+------------------------------------------------------------------+
//| Send account status                                              |
//+------------------------------------------------------------------+
void SendAccountStatus()
{
   string msg = "{" +
      "\"type\":\"account.status\"," +
      "\"data\":{" +
         "\"balance\":" + DoubleToString(AccountBalance(), 2) + "," +
         "\"equity\":" + DoubleToString(AccountEquity(), 2) + "," +
         "\"margin\":" + DoubleToString(AccountMargin(), 2) + "," +
         "\"freeMargin\":" + DoubleToString(AccountFreeMargin(), 2) + "," +
         "\"profit\":" + DoubleToString(AccountProfit(), 2) +
      "}" +
   "}";
   
   SendMessage(msg);
}

//+------------------------------------------------------------------+
//| Send position status                                             |
//+------------------------------------------------------------------+
void SendPositionStatus()
{
   int total = OrdersTotal();
   double totalProfit = 0;
   int positionCount = 0;
   
   for(int i = 0; i < total; i++)
   {
      if(OrderSelect(i, SELECT_BY_POS))
      {
         if(OrderMagicNumber() == StringToInteger(MagicKey) || OrderMagicNumber() == 0)
         {
            totalProfit += OrderProfit() + OrderSwap() + OrderCommission();
            positionCount++;
         }
      }
   }
   
   string msg = "{" +
      "\"type\":\"position.status\"," +
      "\"data\":{" +
         "\"count\":" + IntegerToString(positionCount) + "," +
         "\"openPL\":" + DoubleToString(totalProfit, 2) +
      "}" +
   "}";
   
   SendMessage(msg);
}

//+------------------------------------------------------------------+
//| Send trade confirmation                                          |
//+------------------------------------------------------------------+
void SendTradeConfirmation(int ticket, string action)
{
   string msg = "{" +
      "\"type\":\"trade.confirmation\"," +
      "\"data\":{" +
         "\"ticket\":" + IntegerToString(ticket) + "," +
         "\"action\":\"" + action + "\"" +
      "}" +
   "}";
   
   SendMessage(msg);
}

//+------------------------------------------------------------------+
//| Send trade error                                                 |
//+------------------------------------------------------------------+
void SendTradeError(string error)
{
   string msg = "{" +
      "\"type\":\"trade.error\"," +
      "\"data\":{" +
         "\"error\":\"" + error + "\"" +
      "}" +
   "}";
   
   SendMessage(msg);
}

//+------------------------------------------------------------------+
//| Generate unique client ID                                        |
//+------------------------------------------------------------------+
string GenerateClientId()
{
   return "MT4_" + IntegerToString(AccountNumber()) + "_" + IntegerToString(TimeCurrent());
}

//+------------------------------------------------------------------+
//| Get JSON value (simple parser)                                   |
//+------------------------------------------------------------------+
string GetJsonValue(string json, string key)
{
   string searchKey = "\"" + key + "\":";
   int start = StringFind(json, searchKey);
   if(start == -1) return "";
   
   start += StringLen(searchKey);
   while(start < StringLen(json) && (json[start] == ' ' || json[start] == '\t')) start++;
   
   if(json[start] == '"')
   {
      start++;
      int end = StringFind(json, "\"", start);
      if(end == -1) return "";
      return StringSubstr(json, start, end - start);
   }
   else
   {
      int end = start;
      while(end < StringLen(json) && json[end] != ',' && json[end] != '}' && json[end] != ']') end++;
      return StringSubstr(json, start, end - start);
   }
}

//+------------------------------------------------------------------+
//| Get JSON object                                                  |
//+------------------------------------------------------------------+
string GetJsonObject(string json, string key)
{
   string searchKey = "\"" + key + "\":";
   int start = StringFind(json, searchKey);
   if(start == -1) return "";
   
   start += StringLen(searchKey);
   while(start < StringLen(json) && (json[start] == ' ' || json[start] == '\t')) start++;
   
   if(json[start] != '{') return "";
   
   int braceCount = 1;
   int end = start + 1;
   
   while(end < StringLen(json) && braceCount > 0)
   {
      if(json[end] == '{') braceCount++;
      if(json[end] == '}') braceCount--;
      end++;
   }
   
   return StringSubstr(json, start, end - start);
}

//+------------------------------------------------------------------+
//| Draw line from message (Magic Keys style)                        |
//+------------------------------------------------------------------+
void DrawLineFromMessage(string message)
{
   string data = GetJsonObject(message, "data");
   string lineType = GetJsonValue(data, "lineType");
   double price = StringToDouble(GetJsonValue(data, "price"));
   
   if(price <= 0) return;
   
   if(lineType == "SL") DrawSLLine(price);
   else if(lineType == "TP") DrawTPLine(price);
   else if(lineType == "ENTRY") DrawEntryLine(price);
   
   Print("Line drawn: ", lineType, " at ", price);
}

//+------------------------------------------------------------------+
//| Draw Stop Loss line                                              |
//+------------------------------------------------------------------+
void DrawSLLine(double price)
{
   // Delete existing line
   ObjectDelete(0, g_slLineName);
   
   // Create horizontal line
   if(!ObjectCreate(0, g_slLineName, OBJ_HLINE, 0, 0, price))
   {
      Print("ERROR: Failed to create SL line");
      return;
   }
   
   // Set line properties
   ObjectSetInteger(0, g_slLineName, OBJPROP_COLOR, g_slLineColor);
   ObjectSetInteger(0, g_slLineName, OBJPROP_WIDTH, 2);
   ObjectSetInteger(0, g_slLineName, OBJPROP_STYLE, STYLE_SOLID);
   ObjectSetString(0, g_slLineName, OBJPROP_TEXT, "SL");
   ObjectSetInteger(0, g_slLineName, OBJPROP_SELECTABLE, true);
   ObjectSetInteger(0, g_slLineName, OBJPROP_SELECTED, false);
   ObjectSetInteger(0, g_slLineName, OBJPROP_HIDDEN, false);
   
   ChartRedraw(0);
}

//+------------------------------------------------------------------+
//| Draw Take Profit line                                            |
//+------------------------------------------------------------------+
void DrawTPLine(double price)
{
   // Delete existing line
   ObjectDelete(0, g_tpLineName);
   
   // Create horizontal line
   if(!ObjectCreate(0, g_tpLineName, OBJ_HLINE, 0, 0, price))
   {
      Print("ERROR: Failed to create TP line");
      return;
   }
   
   // Set line properties
   ObjectSetInteger(0, g_tpLineName, OBJPROP_COLOR, g_tpLineColor);
   ObjectSetInteger(0, g_tpLineName, OBJPROP_WIDTH, 2);
   ObjectSetInteger(0, g_tpLineName, OBJPROP_STYLE, STYLE_SOLID);
   ObjectSetString(0, g_tpLineName, OBJPROP_TEXT, "TP");
   ObjectSetInteger(0, g_tpLineName, OBJPROP_SELECTABLE, true);
   ObjectSetInteger(0, g_tpLineName, OBJPROP_SELECTED, false);
   ObjectSetInteger(0, g_tpLineName, OBJPROP_HIDDEN, false);
   
   ChartRedraw(0);
}

//+------------------------------------------------------------------+
//| Draw Entry line                                                  |
//+------------------------------------------------------------------+
void DrawEntryLine(double price)
{
   // Delete existing line
   ObjectDelete(0, g_entryLineName);
   
   // Create horizontal line
   if(!ObjectCreate(0, g_entryLineName, OBJ_HLINE, 0, 0, price))
   {
      Print("ERROR: Failed to create Entry line");
      return;
   }
   
   // Set line properties
   ObjectSetInteger(0, g_entryLineName, OBJPROP_COLOR, g_entryLineColor);
   ObjectSetInteger(0, g_entryLineName, OBJPROP_WIDTH, 1);
   ObjectSetInteger(0, g_entryLineName, OBJPROP_STYLE, STYLE_DASH);
   ObjectSetString(0, g_entryLineName, OBJPROP_TEXT, "ENTRY");
   ObjectSetInteger(0, g_entryLineName, OBJPROP_SELECTABLE, true);
   ObjectSetInteger(0, g_entryLineName, OBJPROP_SELECTED, false);
   ObjectSetInteger(0, g_entryLineName, OBJPROP_HIDDEN, false);
   
   ChartRedraw(0);
}

//+------------------------------------------------------------------+
//| Draw Partial TP line                                             |
//+------------------------------------------------------------------+
void DrawPartialTPLine(int level, double price, double percent)
{
   string lineName = g_ptpLinePrefix + IntegerToString(level);
   
   // Delete existing line
   ObjectDelete(0, lineName);
   
   // Create horizontal line
   if(!ObjectCreate(0, lineName, OBJ_HLINE, 0, 0, price))
   {
      Print("ERROR: Failed to create PTP line ", level);
      return;
   }
   
   // Set line properties
   ObjectSetInteger(0, lineName, OBJPROP_COLOR, g_ptpLineColor);
   ObjectSetInteger(0, lineName, OBJPROP_WIDTH, 1);
   ObjectSetInteger(0, lineName, OBJPROP_STYLE, STYLE_DOT);
   ObjectSetString(0, lineName, OBJPROP_TEXT, "TP" + IntegerToString(level) + " (" + DoubleToString(percent, 0) + "%)");
   ObjectSetInteger(0, lineName, OBJPROP_SELECTABLE, true);
   ObjectSetInteger(0, lineName, OBJPROP_SELECTED, false);
   ObjectSetInteger(0, lineName, OBJPROP_HIDDEN, false);
   
   ChartRedraw(0);
}

//+------------------------------------------------------------------+
//| Clear all visual lines                                           |
//+------------------------------------------------------------------+
void ClearAllLines()
{
   ObjectDelete(0, g_slLineName);
   ObjectDelete(0, g_tpLineName);
   ObjectDelete(0, g_entryLineName);
   
   // Clear partial TP lines
   for(int i = 0; i < 10; i++)
   {
      ObjectDelete(0, g_ptpLinePrefix + IntegerToString(i));
   }
   
   ChartRedraw(0);
   Print("All visual lines cleared");
}

//+------------------------------------------------------------------+
//| Check for line drag (call from OnTick)                           |
//+------------------------------------------------------------------+
void CheckLineDrag()
{
   // Check if SL line was moved
   if(ObjectFind(0, g_slLineName) >= 0)
   {
      double currentPrice = ObjectGetDouble(0, g_slLineName, OBJPROP_PRICE);
      static double lastSLPrice = 0;
      
      if(lastSLPrice != 0 && MathAbs(currentPrice - lastSLPrice) > Point)
      {
         // Line was moved, notify app
         SendMessage("{" +
            "\"type\":\"line_update\"," +
            "\"data\":{" +
               "\"lineType\":\"SL\"," +
               "\"price\":" + DoubleToString(currentPrice, 5) +
            "}" +
         "}");
      }
      lastSLPrice = currentPrice;
   }
   
   // Check if TP line was moved
   if(ObjectFind(0, g_tpLineName) >= 0)
   {
      double currentPrice = ObjectGetDouble(0, g_tpLineName, OBJPROP_PRICE);
      static double lastTPPrice = 0;
      
      if(lastTPPrice != 0 && MathAbs(currentPrice - lastTPPrice) > Point)
      {
         // Line was moved, notify app
         SendMessage("{" +
            "\"type\":\"line_update\"," +
            "\"data\":{" +
               "\"lineType\":\"TP\"," +
               "\"price\":" + DoubleToString(currentPrice, 5) +
            "}" +
         "}");
      }
      lastTPPrice = currentPrice;
   }
}

//+------------------------------------------------------------------+
//| Update SetPartialTPLevels to draw lines                          |
//+------------------------------------------------------------------+
void SetPartialTPLevels(string message)
{
   string data = GetJsonObject(message, "data");
   string symbol = GetJsonValue(data, "symbol");
   
   // Clear old PTP lines
   for(int i = 0; i < 10; i++)
   {
      ObjectDelete(0, g_ptpLinePrefix + IntegerToString(i));
   }
   
   // Parse levels from message (simplified - price-based)
   // In real implementation, parse the JSON array properly
   g_tpLevelCount = 0;
   
   // Example: Set 3 default levels with price-based triggers
   // These would be parsed from the message in real implementation
   double currentPrice = (Bid + Ask) / 2;
   double pipSize = Point * 10;
   
   // Example levels - would be set from app
   g_tpLevels[0].level = 1; 
   g_tpLevels[0].price = currentPrice + (30 * pipSize); 
   g_tpLevels[0].percent = 50; 
   g_tpLevels[0].triggered = false;
   DrawPartialTPLine(1, g_tpLevels[0].price, g_tpLevels[0].percent);
   
   g_tpLevels[1].level = 2; 
   g_tpLevels[1].price = currentPrice + (50 * pipSize); 
   g_tpLevels[1].percent = 30; 
   g_tpLevels[1].triggered = false;
   DrawPartialTPLine(2, g_tpLevels[1].price, g_tpLevels[1].percent);
   
   g_tpLevels[2].level = 3; 
   g_tpLevels[2].price = currentPrice + (80 * pipSize); 
   g_tpLevels[2].percent = 20; 
   g_tpLevels[2].triggered = false;
   DrawPartialTPLine(3, g_tpLevels[2].price, g_tpLevels[2].percent);
   
   g_tpLevelCount = 3;
   
   Print("Partial TP levels set: ", g_tpLevelCount, " levels (price-based)");
   SendMessage("{\"type\":\"partial_tp_set\",\"data\":{\"count\":" + IntegerToString(g_tpLevelCount) + "}}");
}

//+------------------------------------------------------------------+
//| Check partial TP triggers - PRICE BASED                          |
//+------------------------------------------------------------------+
void CheckPartialTPTriggers()
{
   if(g_tpLevelCount == 0) return;
   
   int total = OrdersTotal();
   
   for(int i = 0; i < total; i++)
   {
      if(OrderSelect(i, SELECT_BY_POS))
      {
         if(OrderMagicNumber() == StringToInteger(MagicKey) || OrderMagicNumber() == 0)
         {
            double currentPrice = (OrderType() == ORDER_TYPE_BUY) ? Bid : Ask;
            
            for(int j = 0; j < g_tpLevelCount; j++)
            {
               if(!g_tpLevels[j].triggered)
               {
                  bool triggered = false;
                  
                  if(OrderType() == ORDER_TYPE_BUY && currentPrice >= g_tpLevels[j].price)
                     triggered = true;
                  else if(OrderType() == ORDER_TYPE_SELL && currentPrice <= g_tpLevels[j].price)
                     triggered = true;
                  
                  if(triggered)
                  {
                     // Trigger partial close
                     double closeLots = NormalizeDouble(OrderLots() * g_tpLevels[j].percent / 100, 2);
                     if(closeLots > 0)
                     {
                        double price = (OrderType() == ORDER_TYPE_BUY) ? Bid : Ask;
                        if(OrderClose(OrderTicket(), closeLots, price, 3, clrPurple))
                        {
                           g_tpLevels[j].triggered = true;
                           Print("Partial TP triggered: Level ", j + 1, " at price ", g_tpLevels[j].price, " - ", g_tpLevels[j].percent, "% closed");
                           
                           SendMessage("{" +
                              "\"type\":\"partial_tp_triggered\"," +
                              "\"data\":{" +
                                 "\"level\":" + IntegerToString(j + 1) + "," +
                                 "\"price\":" + DoubleToString(g_tpLevels[j].price, 5) + "," +
                                 "\"percent\":" + DoubleToString(g_tpLevels[j].percent, 0) +
                              "}" +
                           "}");
                        }
                     }
                  }
               }
            }
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Send market data to app                                          |
//+------------------------------------------------------------------+
void SendMarketData()
{
   string msg = "{" +
      "\"type\":\"market_data\"," +
      "\"data\":{" +
         "\"symbol\":\"" + Symbol() + "\"," +
         "\"bid\":" + DoubleToString(Bid, g_symbolDigits) + "," +
         "\"ask\":" + DoubleToString(Ask, g_symbolDigits) + "," +
         "\"point\":" + DoubleToString(Point, 5) + "," +
         "\"pipSize\":" + DoubleToString(g_pipSize, 5) + "," +
         "\"spread\":" + IntegerToString((int)((Ask - Bid) / Point)) +
      "}" +
   "}";
   
   SendMessage(msg);
}

//+------------------------------------------------------------------+
//| Update lot size display on chart                                 |
//+------------------------------------------------------------------+
void UpdateLotSizeDisplay(string message)
{
   string data = GetJsonObject(message, "data");
   double lotSize = StringToDouble(GetJsonValue(data, "lotSize"));
   
   g_currentLotSize = lotSize;
   
   // Delete existing label
   ObjectDelete(0, g_lotSizeLabelName);
   
   // Create label object
   if(!ObjectCreate(0, g_lotSizeLabelName, OBJ_LABEL, 0, 0, 0))
   {
      Print("ERROR: Failed to create lot size label");
      return;
   }
   
   // Set label properties
   ObjectSetInteger(0, g_lotSizeLabelName, OBJPROP_XDISTANCE, 10);
   ObjectSetInteger(0, g_lotSizeLabelName, OBJPROP_YDISTANCE, 30);
   ObjectSetString(0, g_lotSizeLabelName, OBJPROP_FONT, "Arial");
   ObjectSetInteger(0, g_lotSizeLabelName, OBJPROP_FONTSIZE, 10);
   ObjectSetInteger(0, g_lotSizeLabelName, OBJPROP_COLOR, clrWhite);
   ObjectSetInteger(0, g_lotSizeLabelName, OBJPROP_BGCOLOR, C'30,30,30');
   ObjectSetInteger(0, g_lotSizeLabelName, OBJPROP_BORDER_TYPE, BORDER_FLAT);
   ObjectSetString(0, g_lotSizeLabelName, OBJPROP_TEXT, "  Lot Size: " + DoubleToString(lotSize, 2) + "  ");
   
   ChartRedraw(0);
   Print("Lot size display updated: ", lotSize);
}

//+------------------------------------------------------------------+
//| Clear partial TP lines only                                      |
//+------------------------------------------------------------------+
void ClearPartialTPLines()
{
   for(int i = 0; i < 10; i++)
   {
      ObjectDelete(0, g_ptpLinePrefix + IntegerToString(i));
   }
   
   // Reset triggered status
   for(int j = 0; j < g_tpLevelCount; j++)
   {
      g_tpLevels[j].triggered = false;
   }
   
   ChartRedraw(0);
   Print("Partial TP lines cleared");
}

//+------------------------------------------------------------------+
//| Update pip counter display                                       |
//+------------------------------------------------------------------+
void UpdatePipCounter()
{
   // Check if we have an open position on this symbol
   int total = OrdersTotal();
   bool hasPosition = false;
   int ticket = 0;
   int orderType = -1;
   double openPrice = 0;
   double lots = 0;
   
   for(int i = 0; i < total; i++)
   {
      if(OrderSelect(i, SELECT_BY_POS))
      {
         if(OrderSymbol() == Symbol() && (OrderMagicNumber() == StringToInteger(MagicKey) || OrderMagicNumber() == 0))
         {
            hasPosition = true;
            ticket = OrderTicket();
            orderType = OrderType();
            openPrice = OrderOpenPrice();
            lots = OrderLots();
            break;
         }
      }
   }
   
   if(!hasPosition)
   {
      // No position - delete counter
      ObjectDelete(0, g_pipCounterName);
      g_entryPrice = 0;
      g_tradeTicket = 0;
      return;
   }
   
   // Calculate pips
   double currentPrice = (orderType == ORDER_TYPE_BUY) ? Bid : Ask;
   double pips = CalculatePips(currentPrice, openPrice);
   
   // Determine color based on profit/loss
   color counterColor;
   string prefix;
   
   if(orderType == ORDER_TYPE_BUY)
   {
      if(currentPrice > openPrice)
      {
         counterColor = clrDodgerBlue;  // Blue for profit
         prefix = "+";
      }
      else
      {
         counterColor = clrDarkOrange;  // Orange for loss
         prefix = "";
      }
   }
   else // SELL
   {
      if(currentPrice < openPrice)
      {
         counterColor = clrDodgerBlue;  // Blue for profit
         prefix = "+";
      }
      else
      {
         counterColor = clrDarkOrange;  // Orange for loss
         prefix = "";
      }
   }
   
   // Delete existing counter
   ObjectDelete(0, g_pipCounterName);
   
   // Create label at top right corner
   if(!ObjectCreate(0, g_pipCounterName, OBJ_LABEL, 0, 0, 0))
   {
      return;
   }
   
   // Set label properties
   int chartWidth = (int)ChartGetInteger(0, CHART_WIDTH_IN_PIXELS);
   ObjectSetInteger(0, g_pipCounterName, OBJPROP_CORNER, CORNER_RIGHT_UPPER);
   ObjectSetInteger(0, g_pipCounterName, OBJPROP_XDISTANCE, 10);
   ObjectSetInteger(0, g_pipCounterName, OBJPROP_YDISTANCE, 10);
   ObjectSetString(0, g_pipCounterName, OBJPROP_FONT, "Arial Bold");
   ObjectSetInteger(0, g_pipCounterName, OBJPROP_FONTSIZE, 14);
   ObjectSetInteger(0, g_pipCounterName, OBJPROP_COLOR, counterColor);
   ObjectSetInteger(0, g_pipCounterName, OBJPROP_BGCOLOR, C'20,20,20');
   ObjectSetInteger(0, g_pipCounterName, OBJPROP_BORDER_TYPE, BORDER_FLAT);
   
   // Format text
   string directionText = (orderType == ORDER_TYPE_BUY) ? "BUY" : "SELL";
   string counterText = "  " + directionText + " " + DoubleToString(lots, 2) + " | " + prefix + DoubleToString(pips, 1) + " pips  ";
   ObjectSetString(0, g_pipCounterName, OBJPROP_TEXT, counterText);
   
   ChartRedraw(0);
}

//+------------------------------------------------------------------+
