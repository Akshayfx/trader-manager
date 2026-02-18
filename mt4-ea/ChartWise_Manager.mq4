//+------------------------------------------------------------------+
//|                                            ChartWise_Manager.mq4 |
//|                                  Copyright 2026, Chartwise Team |
//|                                             https://chartwise.io |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Chartwise Team"
#property link      "https://chartwise.io"
#property version   "1.00"
#property strict
#property indicator_chart_window

//--- Input Parameters
input double   InpRiskPercent = 2.0;        // Risk Percentage per trade
input int      InpMagicNumber = 123456;     // Magic Number for orders
input color    InpSLColor = clrRed;         // Stop Loss Line Color
input color    InpTPColor = clrLime;        // Take Profit Line Color
input color    InpEntryColor = clrDodgerBlue; // Entry Line Color
input bool     InpEnableAlerts = true;      // Enable Audio Alerts
input bool     InpShowCalculations = true;  // Show Real-time Calculations
input bool     InpAutoBreakeven = false;    // Enable Auto Breakeven
input int      InpBreakevenPips = 20;       // Breakeven Trigger (pips)
input int      InpBreakevenPlus = 5;        // Breakeven Plus (pips)

//--- Global Variables
#define MAGIC_NUMBER InpMagicNumber
#define PIPE_NAME "\\\\.\\\\pipe\\ChartWise_Command_Pipe"

// Trade parameters
double g_EntryPrice = 0;
double g_StopLoss = 0;
double g_TakeProfit = 0;
double g_LotSize = 0;
double g_RiskPercent = InpRiskPercent;
int g_SLPips = 0;
int g_TPPips = 0;
double g_RiskAmount = 0;
double g_PotentialProfit = 0;
double g_RRRatio = 0;

// State management
bool g_SmartOpenActive = false;
bool g_LinesCreated = false;
bool g_PendingMode = false;

// WebSocket simulation via file/pipe communication
string g_CommandFile = "ChartWise\\commands.txt";
string g_ResponseFile = "ChartWise\\responses.txt";
int g_LastCheckTime = 0;

// Partial TP triggers
struct TriggerInfo
{
   string symbol;
   double triggerPrice;
   double percentToClose;
   bool isActive;
   string lineName;
   datetime createdTime;
};

TriggerInfo g_PartialTP_Triggers[];
TriggerInfo g_AutoBE_Triggers[];

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   // Create ChartWise directory
   string path = TerminalInfoString(TERMINAL_DATA_PATH) + "\\MQL4\\Files\\ChartWise";
   if(!FolderCreate(path))
   {
      Print("ChartWise directory already exists or error creating");
   }
   
   // Create UI buttons
   CreateControlPanel();
   
   Print("=================================");
   Print("ChartWise Trade Manager v1.0");
   Print("Magic Number: ", MAGIC_NUMBER);
   Print("=================================");
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   // Clean up all objects
   DeleteAllChartWiseObjects();
   
   Print("ChartWise Trade Manager removed");
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   // Update calculations if lines are active
   if(g_SmartOpenActive && g_LinesCreated)
   {
      UpdateTradeCalculations();
      UpdatePipLabels();
   }
   
   // Check for commands from Desktop App
   CheckForCommands();
   
   // Check auto breakeven triggers
   CheckAutoBreakevenTriggers();
   
   // Check partial TP triggers
   CheckPartialTPTriggers();
}

//+------------------------------------------------------------------+
//| ChartEvent function                                               |
//+------------------------------------------------------------------+
void OnChartEvent(const int id, const long &lparam, const double &dparam, const string &sparam)
{
   // Handle line dragging
   if(id == CHARTEVENT_OBJECT_DRAG)
   {
      if(StringFind(sparam, "ChartWise_") >= 0)
      {
         ValidateLinePrices();
         UpdateTradeCalculations();
         UpdatePipLabels();
         ChartRedraw(0);
      }
   }
   
   // Handle button clicks
   if(id == CHARTEVENT_OBJECT_CLICK)
   {
      HandleButtonClick(sparam);
      
      // Reset button state
      ObjectSetInteger(0, sparam, OBJPROP_STATE, false);
      ChartRedraw(0);
   }
}

//+------------------------------------------------------------------+
//| Create control panel with buttons                                |
//+------------------------------------------------------------------+
void CreateControlPanel()
{
   int xPos = 20;
   int yPos = 50;
   int buttonWidth = 140;
   int buttonHeight = 35;
   int buttonSpacing = 10;
   
   // Smart Open Button
   CreateButton("ChartWise_SmartOpen_Btn", "🎯 SMART OPEN", 
                xPos, yPos, buttonWidth, buttonHeight, clrDodgerBlue);
   
   // Open Trade Button
   yPos += buttonHeight + buttonSpacing;
   CreateButton("ChartWise_OpenTrade_Btn", "🚀 OPEN TRADE", 
                xPos, yPos, buttonWidth, buttonHeight, clrDodgerBlue);
   
   // Partial TP Button
   yPos += buttonHeight + buttonSpacing;
   CreateButton("ChartWise_PartialTP_Btn", "📊 PARTIAL TP", 
                xPos, yPos, buttonWidth, buttonHeight, clrOrange);
   
   // Close Half Button
   yPos += buttonHeight + buttonSpacing;
   CreateButton("ChartWise_CloseHalf_Btn", "✂️ CLOSE ½", 
                xPos, yPos, buttonWidth, buttonHeight, clrGray);
   
   // SL to BE Button
   yPos += buttonHeight + buttonSpacing;
   CreateButton("ChartWise_SLtoBE_Btn", "➡️ SL → BE", 
                xPos, yPos, buttonWidth, buttonHeight, clrTeal);
   
   // Close All Button
   yPos += buttonHeight + buttonSpacing;
   CreateButton("ChartWise_CloseAll_Btn", "🚫 CLOSE ALL", 
                xPos, yPos, buttonWidth, buttonHeight, clrCrimson);
}

//+------------------------------------------------------------------+
//| Create individual button                                          |
//+------------------------------------------------------------------+
void CreateButton(string name, string text, int x, int y, int width, int height, color bgColor)
{
   if(ObjectFind(0, name) >= 0)
      ObjectDelete(0, name);
   
   ObjectCreate(0, name, OBJ_BUTTON, 0, 0, 0);
   ObjectSetInteger(0, name, OBJPROP_XDISTANCE, x);
   ObjectSetInteger(0, name, OBJPROP_YDISTANCE, y);
   ObjectSetInteger(0, name, OBJPROP_XSIZE, width);
   ObjectSetInteger(0, name, OBJPROP_YSIZE, height);
   ObjectSetInteger(0, name, OBJPROP_CORNER, CORNER_LEFT_UPPER);
   ObjectSetInteger(0, name, OBJPROP_BGCOLOR, bgColor);
   ObjectSetInteger(0, name, OBJPROP_COLOR, clrWhite);
   ObjectSetInteger(0, name, OBJPROP_FONTSIZE, 9);
   ObjectSetString(0, name, OBJPROP_FONT, "Arial Bold");
   ObjectSetString(0, name, OBJPROP_TEXT, text);
   ObjectSetInteger(0, name, OBJPROP_STATE, false);
   ObjectSetInteger(0, name, OBJPROP_SELECTABLE, false);
}

//+------------------------------------------------------------------+
//| Handle button clicks                                              |
//+------------------------------------------------------------------+
void HandleButtonClick(string buttonName)
{
   Print("Button clicked: ", buttonName);
   
   if(buttonName == "ChartWise_SmartOpen_Btn")
   {
      ActivateSmartOpen();
   }
   else if(buttonName == "ChartWise_OpenTrade_Btn")
   {
      OpenTradeDialog();
   }
   else if(buttonName == "ChartWise_PartialTP_Btn")
   {
      ActivatePartialTP();
   }
   else if(buttonName == "ChartWise_CloseHalf_Btn")
   {
      CloseHalfPosition();
   }
   else if(buttonName == "ChartWise_SLtoBE_Btn")
   {
      MoveSLtoBreakeven();
   }
   else if(buttonName == "ChartWise_CloseAll_Btn")
   {
      CloseAllPositions();
   }
   else if(buttonName == "ChartWise_Execute_Btn")
   {
      ExecuteTrade();
   }
   else if(buttonName == "ChartWise_Cancel_Btn")
   {
      CancelSmartOpen();
   }
}

//+------------------------------------------------------------------+
//| Activate Smart Open mode                                         |
//+------------------------------------------------------------------+
void ActivateSmartOpen()
{
   if(g_SmartOpenActive)
   {
      Alert("Smart Open is already active!");
      return;
   }
   
   g_SmartOpenActive = true;
   CreateTradingLines();
   ShowExecuteButtons();
   
   if(InpEnableAlerts)
      PlaySound("alert.wav");
   
   Print("Smart Open activated - Drag SL and TP lines to set trade");
}

//+------------------------------------------------------------------+
//| Create draggable trading lines                                   |
//+------------------------------------------------------------------+
void CreateTradingLines()
{
   double currentPrice = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   
   // Default SL: 50 pips below current price
   double defaultSL = currentPrice - (50 * _Point * 10);
   
   // Default TP: 100 pips above current price  
   double defaultTP = currentPrice + (100 * _Point * 10);
   
   // Create Stop Loss Line (RED)
   if(ObjectFind(0, "ChartWise_SL") < 0)
   {
      ObjectCreate(0, "ChartWise_SL", OBJ_HLINE, 0, 0, defaultSL);
      ObjectSetInteger(0, "ChartWise_SL", OBJPROP_COLOR, InpSLColor);
      ObjectSetInteger(0, "ChartWise_SL", OBJPROP_WIDTH, 2);
      ObjectSetInteger(0, "ChartWise_SL", OBJPROP_STYLE, STYLE_SOLID);
      ObjectSetInteger(0, "ChartWise_SL", OBJPROP_SELECTABLE, true);
      ObjectSetInteger(0, "ChartWise_SL", OBJPROP_SELECTED, false);
      ObjectSetString(0, "ChartWise_SL", OBJPROP_TEXT, "Stop Loss - Drag to adjust");
      ObjectSetInteger(0, "ChartWise_SL", OBJPROP_BACK, false);
   }
   
   // Create Take Profit Line (GREEN)
   if(ObjectFind(0, "ChartWise_TP") < 0)
   {
      ObjectCreate(0, "ChartWise_TP", OBJ_HLINE, 0, 0, defaultTP);
      ObjectSetInteger(0, "ChartWise_TP", OBJPROP_COLOR, InpTPColor);
      ObjectSetInteger(0, "ChartWise_TP", OBJPROP_WIDTH, 2);
      ObjectSetInteger(0, "ChartWise_TP", OBJPROP_STYLE, STYLE_SOLID);
      ObjectSetInteger(0, "ChartWise_TP", OBJPROP_SELECTABLE, true);
      ObjectSetInteger(0, "ChartWise_TP", OBJPROP_SELECTED, false);
      ObjectSetString(0, "ChartWise_TP", OBJPROP_TEXT, "Take Profit - Drag to adjust");
      ObjectSetInteger(0, "ChartWise_TP", OBJPROP_BACK, false);
   }
   
   // Create Entry Price Line (BLUE)
   if(ObjectFind(0, "ChartWise_Entry") < 0)
   {
      ObjectCreate(0, "ChartWise_Entry", OBJ_HLINE, 0, 0, currentPrice);
      ObjectSetInteger(0, "ChartWise_Entry", OBJPROP_COLOR, InpEntryColor);
      ObjectSetInteger(0, "ChartWise_Entry", OBJPROP_WIDTH, 2);
      ObjectSetInteger(0, "ChartWise_Entry", OBJPROP_STYLE, STYLE_DOT);
      ObjectSetInteger(0, "ChartWise_Entry", OBJPROP_SELECTABLE, true);
      ObjectSetInteger(0, "ChartWise_Entry", OBJPROP_SELECTED, false);
      ObjectSetString(0, "ChartWise_Entry", OBJPROP_TEXT, "Entry Price");
      ObjectSetInteger(0, "ChartWise_Entry", OBJPROP_BACK, false);
   }
   
   // Create labels
   CreatePipLabels();
   
   // Update calculations
   UpdateTradeCalculations();
   
   g_LinesCreated = true;
}

//+------------------------------------------------------------------+
//| Create labels showing pip distances                              |
//+------------------------------------------------------------------+
void CreatePipLabels()
{
   // SL Pips Label
   if(ObjectFind(0, "ChartWise_SL_Label") < 0)
   {
      ObjectCreate(0, "ChartWise_SL_Label", OBJ_LABEL, 0, 0, 0);
      ObjectSetInteger(0, "ChartWise_SL_Label", OBJPROP_CORNER, CORNER_RIGHT_UPPER);
      ObjectSetInteger(0, "ChartWise_SL_Label", OBJPROP_XDISTANCE, 150);
      ObjectSetInteger(0, "ChartWise_SL_Label", OBJPROP_YDISTANCE, 100);
      ObjectSetInteger(0, "ChartWise_SL_Label", OBJPROP_COLOR, clrRed);
      ObjectSetInteger(0, "ChartWise_SL_Label", OBJPROP_FONTSIZE, 10);
      ObjectSetString(0, "ChartWise_SL_Label", OBJPROP_FONT, "Arial Bold");
   }
   
   // TP Pips Label
   if(ObjectFind(0, "ChartWise_TP_Label") < 0)
   {
      ObjectCreate(0, "ChartWise_TP_Label", OBJ_LABEL, 0, 0, 0);
      ObjectSetInteger(0, "ChartWise_TP_Label", OBJPROP_CORNER, CORNER_RIGHT_UPPER);
      ObjectSetInteger(0, "ChartWise_TP_Label", OBJPROP_XDISTANCE, 150);
      ObjectSetInteger(0, "ChartWise_TP_Label", OBJPROP_YDISTANCE, 120);
      ObjectSetInteger(0, "ChartWise_TP_Label", OBJPROP_COLOR, clrLime);
      ObjectSetInteger(0, "ChartWise_TP_Label", OBJPROP_FONTSIZE, 10);
      ObjectSetString(0, "ChartWise_TP_Label", OBJPROP_FONT, "Arial Bold");
   }
   
   // Lot Size Label
   if(ObjectFind(0, "ChartWise_Lot_Label") < 0)
   {
      ObjectCreate(0, "ChartWise_Lot_Label", OBJ_LABEL, 0, 0, 0);
      ObjectSetInteger(0, "ChartWise_Lot_Label", OBJPROP_CORNER, CORNER_RIGHT_UPPER);
      ObjectSetInteger(0, "ChartWise_Lot_Label", OBJPROP_XDISTANCE, 150);
      ObjectSetInteger(0, "ChartWise_Lot_Label", OBJPROP_YDISTANCE, 140);
      ObjectSetInteger(0, "ChartWise_Lot_Label", OBJPROP_COLOR, clrYellow);
      ObjectSetInteger(0, "ChartWise_Lot_Label", OBJPROP_FONTSIZE, 11);
      ObjectSetString(0, "ChartWise_Lot_Label", OBJPROP_FONT, "Arial Bold");
   }
}

//+------------------------------------------------------------------+
//| Validate line positions                                          |
//+------------------------------------------------------------------+
void ValidateLinePrices()
{
   double entryPrice = ObjectGetDouble(0, "ChartWise_Entry", OBJPROP_PRICE1);
   double slPrice = ObjectGetDouble(0, "ChartWise_SL", OBJPROP_PRICE1);
   double tpPrice = ObjectGetDouble(0, "ChartWise_TP", OBJPROP_PRICE1);
   
   // Determine trade direction
   bool isLong = (tpPrice > entryPrice);
   
   if(isLong)
   {
      // LONG position validation
      if(slPrice >= entryPrice)
      {
         slPrice = entryPrice - (10 * _Point * 10);
         ObjectSetDouble(0, "ChartWise_SL", OBJPROP_PRICE1, slPrice);
      }
      
      if(tpPrice <= entryPrice)
      {
         tpPrice = entryPrice + (20 * _Point * 10);
         ObjectSetDouble(0, "ChartWise_TP", OBJPROP_PRICE1, tpPrice);
      }
   }
   else
   {
      // SHORT position validation
      if(slPrice <= entryPrice)
      {
         slPrice = entryPrice + (10 * _Point * 10);
         ObjectSetDouble(0, "ChartWise_SL", OBJPROP_PRICE1, slPrice);
      }
      
      if(tpPrice >= entryPrice)
      {
         tpPrice = entryPrice - (20 * _Point * 10);
         ObjectSetDouble(0, "ChartWise_TP", OBJPROP_PRICE1, tpPrice);
      }
   }
}

//+------------------------------------------------------------------+
//| Update all trade calculations                                     |
//+------------------------------------------------------------------+
void UpdateTradeCalculations()
{
   // Get line prices
   g_EntryPrice = ObjectGetDouble(0, "ChartWise_Entry", OBJPROP_PRICE1);
   g_StopLoss = ObjectGetDouble(0, "ChartWise_SL", OBJPROP_PRICE1);
   g_TakeProfit = ObjectGetDouble(0, "ChartWise_TP", OBJPROP_PRICE1);
   
   // Determine trade direction
   bool isLong = (g_TakeProfit > g_EntryPrice);
   
   // Calculate pip distances
   if(isLong)
   {
      g_SLPips = int((g_EntryPrice - g_StopLoss) / (_Point * 10));
      g_TPPips = int((g_TakeProfit - g_EntryPrice) / (_Point * 10));
   }
   else
   {
      g_SLPips = int((g_StopLoss - g_EntryPrice) / (_Point * 10));
      g_TPPips = int((g_EntryPrice - g_TakeProfit) / (_Point * 10));
   }
   
   // Calculate R:R ratio
   if(g_SLPips > 0)
      g_RRRatio = (double)g_TPPips / (double)g_SLPips;
   else
      g_RRRatio = 0;
   
   // Calculate lot size
   g_LotSize = CalculateLotSize(g_RiskPercent, g_SLPips);
   
   // Calculate risk amount
   g_RiskAmount = (AccountBalance() * g_RiskPercent) / 100.0;
   
   // Calculate potential profit
   double pipValue = MarketInfo(_Symbol, MODE_TICKVALUE) * 10;
   g_PotentialProfit = g_LotSize * g_TPPips * pipValue;
}

//+------------------------------------------------------------------+
//| Calculate lot size based on risk percentage                      |
//+------------------------------------------------------------------+
double CalculateLotSize(double riskPercent, int stopLossPips)
{
   if(stopLossPips <= 0)
      return 0.01;
   
   double accountBalance = AccountBalance();
   double riskAmount = (accountBalance * riskPercent) / 100.0;
   
   double tickValue = MarketInfo(_Symbol, MODE_TICKVALUE);
   double tickSize = MarketInfo(_Symbol, MODE_TICKSIZE);
   double pipValue = tickValue / tickSize * _Point * 10;
   
   double lotSize = riskAmount / (stopLossPips * pipValue);
   
   // Round to broker's lot step
   double minLot = MarketInfo(_Symbol, MODE_MINLOT);
   double maxLot = MarketInfo(_Symbol, MODE_MAXLOT);
   double lotStep = MarketInfo(_Symbol, MODE_LOTSTEP);
   
   lotSize = MathFloor(lotSize / lotStep) * lotStep;
   
   if(lotSize < minLot) lotSize = minLot;
   if(lotSize > maxLot) lotSize = maxLot;
   
   return lotSize;
}

//+------------------------------------------------------------------+
//| Update visual labels with current values                         |
//+------------------------------------------------------------------+
void UpdatePipLabels()
{
   string slText = StringFormat("🛑 SL: %d pips", g_SLPips);
   ObjectSetString(0, "ChartWise_SL_Label", OBJPROP_TEXT, slText);
   
   string tpText = StringFormat("🎯 TP: %d pips", g_TPPips);
   ObjectSetString(0, "ChartWise_TP_Label", OBJPROP_TEXT, tpText);
   
   string lotText = StringFormat("📊 Lot: %.2f | R:R 1:%.1f | Risk: $%.0f", 
                                  g_LotSize, g_RRRatio, g_RiskAmount);
   ObjectSetString(0, "ChartWise_Lot_Label", OBJPROP_TEXT, lotText);
}

//+------------------------------------------------------------------+
//| Show Execute/Cancel buttons                                      |
//+------------------------------------------------------------------+
void ShowExecuteButtons()
{
   int xPos = 20;
   int yPos = 320;
   int buttonWidth = 140;
   int buttonHeight = 40;
   
   CreateButton("ChartWise_Execute_Btn", "✓ EXECUTE", 
                xPos, yPos, buttonWidth, buttonHeight, clrGreen);
   
   yPos += buttonHeight + 10;
   CreateButton("ChartWise_Cancel_Btn", "✗ CANCEL", 
                xPos, yPos, buttonWidth, buttonHeight, clrGray);
}

//+------------------------------------------------------------------+
//| Execute the trade                                                |
//+------------------------------------------------------------------+
void ExecuteTrade()
{
   if(g_LotSize <= 0)
   {
      Alert("Invalid lot size calculated!");
      return;
   }
   
   if(g_SLPips <= 0)
   {
      Alert("Stop Loss must be set!");
      return;
   }
   
   bool isLong = (g_TakeProfit > g_EntryPrice);
   int orderType;
   double openPrice;
   color orderColor;
   
   double currentPrice = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   
   if(isLong)
   {
      if(MathAbs(g_EntryPrice - currentPrice) < (5 * _Point * 10))
      {
         orderType = OP_BUY;
         openPrice = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
      }
      else if(g_EntryPrice > currentPrice)
      {
         orderType = OP_BUYSTOP;
         openPrice = g_EntryPrice;
      }
      else
      {
         orderType = OP_BUYLIMIT;
         openPrice = g_EntryPrice;
      }
      orderColor = clrGreen;
   }
   else
   {
      currentPrice = SymbolInfoDouble(_Symbol, SYMBOL_BID);
      
      if(MathAbs(g_EntryPrice - currentPrice) < (5 * _Point * 10))
      {
         orderType = OP_SELL;
         openPrice = SymbolInfoDouble(_Symbol, SYMBOL_BID);
      }
      else if(g_EntryPrice < currentPrice)
      {
         orderType = OP_SELLSTOP;
         openPrice = g_EntryPrice;
      }
      else
      {
         orderType = OP_SELLLIMIT;
         openPrice = g_EntryPrice;
      }
      orderColor = clrRed;
   }
   
   string orderComment = StringFormat("ChartWise | Risk: %.1f%% | R:R 1:%.1f", 
                                       g_RiskPercent, g_RRRatio);
   
   int ticket = OrderSend(
      _Symbol,
      orderType,
      g_LotSize,
      openPrice,
      3,
      g_StopLoss,
      g_TakeProfit,
      orderComment,
      MAGIC_NUMBER,
      0,
      orderColor
   );
   
   if(ticket > 0)
   {
      PlaySound("ok.wav");
      
      string successMsg = StringFormat(
         "Trade Executed!\\n" +
         "Ticket: #%d\\n" +
         "Lot Size: %.2f\\n" +
         "Risk: $%.2f (%.1f%%)",
         ticket, g_LotSize, g_RiskAmount, g_RiskPercent
      );
      
      Alert(successMsg);
      
      // Clean up
      CancelSmartOpen();
   }
   else
   {
      int error = GetLastError();
      PlaySound("timeout.wav");
      Alert("Order Failed! Error: ", error);
   }
}

//+------------------------------------------------------------------+
//| Cancel Smart Open                                                |
//+------------------------------------------------------------------+
void CancelSmartOpen()
{
   g_SmartOpenActive = false;
   DeleteAllChartWiseObjects();
   CreateControlPanel();
}

//+------------------------------------------------------------------+
//| Delete all ChartWise objects                                     |
//+------------------------------------------------------------------+
void DeleteAllChartWiseObjects()
{
   ObjectsDeleteAll(0, "ChartWise_");
}

//+------------------------------------------------------------------+
//| Check for commands from Desktop App                              |
//+------------------------------------------------------------------+
void CheckForCommands()
{
   // File-based communication (simpler than named pipes for initial version)
   string filename = TerminalInfoString(TERMINAL_DATA_PATH) + "\\MQL4\\Files\\ChartWise\\commands.txt";
   
   string command = "";
   int handle = FileOpen(filename, FILE_READ|FILE_TXT|FILE_COMMON);
   
   if(handle != INVALID_HANDLE)
   {
      if(FileSize(handle) > 0)
      {
         command = FileReadString(handle);
         FileClose(handle);
         
         // Clear file after reading
         handle = FileOpen(filename, FILE_WRITE|FILE_TXT|FILE_COMMON);
         if(handle != INVALID_HANDLE)
         {
            FileWriteString(handle, "");
            FileClose(handle);
         }
         
         // Process command
         ProcessCommand(command);
      }
      else
      {
         FileClose(handle);
      }
   }
}

//+------------------------------------------------------------------+
//| Process command from Desktop App                                 |
//+------------------------------------------------------------------+
void ProcessCommand(string command)
{
   Print("Received command: ", command);
   
   if(command == "smart_open")
   {
      ActivateSmartOpen();
   }
   else if(command == "close_all")
   {
      CloseAllPositions();
   }
   else if(command == "close_half")
   {
      CloseHalfPosition();
   }
   else if(command == "sl_to_be")
   {
      MoveSLtoBreakeven();
   }
   else if(command == "partial_tp")
   {
      ActivatePartialTP();
   }
}

//+------------------------------------------------------------------+
//| Close all positions                                              |
//+------------------------------------------------------------------+
void CloseAllPositions()
{
   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if(!OrderSelect(i, SELECT_BY_POS)) continue;
      if(OrderMagicNumber() != MAGIC_NUMBER) continue;
      if(OrderSymbol() != _Symbol) continue;
      
      bool result = false;
      
      if(OrderType() == OP_BUY)
         result = OrderClose(OrderTicket(), OrderLots(), Bid, 3, clrRed);
      else if(OrderType() == OP_SELL)
         result = OrderClose(OrderTicket(), OrderLots(), Ask, 3, clrRed);
      
      if(result)
         Print("Closed position #", OrderTicket());
   }
   
   PlaySound("ok.wav");
   Alert("All positions closed!");
}

//+------------------------------------------------------------------+
//| Close half position                                              |
//+------------------------------------------------------------------+
void CloseHalfPosition()
{
   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if(!OrderSelect(i, SELECT_BY_POS)) continue;
      if(OrderMagicNumber() != MAGIC_NUMBER) continue;
      if(OrderSymbol() != _Symbol) continue;
      
      double closeLots = NormalizeDouble(OrderLots() / 2, 2);
      if(closeLots < 0.01) closeLots = OrderLots();
      
      bool result = false;
      
      if(OrderType() == OP_BUY)
         result = OrderClose(OrderTicket(), closeLots, Bid, 3, clrOrange);
      else if(OrderType() == OP_SELL)
         result = OrderClose(OrderTicket(), closeLots, Ask, 3, clrOrange);
      
      if(result)
         Print("Closed 50% of position #", OrderTicket());
   }
}

//+------------------------------------------------------------------+
//| Move SL to breakeven                                             |
//+------------------------------------------------------------------+
void MoveSLtoBreakeven()
{
   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if(!OrderSelect(i, SELECT_BY_POS)) continue;
      if(OrderMagicNumber() != MAGIC_NUMBER) continue;
      if(OrderSymbol() != _Symbol) continue;
      
      double entryPrice = OrderOpenPrice();
      double newSL = entryPrice + (InpBreakevenPlusPips * _Point * 10);
      
      if(OrderType() == OP_SELL)
         newSL = entryPrice - (InpBreakevenPlusPips * _Point * 10);
      
      bool result = OrderModify(OrderTicket(), OrderOpenPrice(), 
                                newSL, OrderTakeProfit(), 0, clrBlue);
      
      if(result)
      {
         Print("Moved SL to BE for ticket #", OrderTicket());
         Alert("✅ Breakeven activated!");
      }
   }
}

//+------------------------------------------------------------------+
//| Activate Partial TP                                              |
//+------------------------------------------------------------------+
void ActivatePartialTP()
{
   double currentPrice = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double tp1 = currentPrice + (30 * _Point * 10);
   
   string lineName = "ChartWise_PartialTP1_" + _Symbol;
   
   ObjectCreate(0, lineName, OBJ_HLINE, 0, 0, tp1);
   ObjectSetInteger(0, lineName, OBJPROP_COLOR, clrLimeGreen);
   ObjectSetInteger(0, lineName, OBJPROP_WIDTH, 2);
   ObjectSetInteger(0, lineName, OBJPROP_STYLE, STYLE_DASHDOT);
   ObjectSetInteger(0, lineName, OBJPROP_SELECTABLE, true);
   ObjectSetString(0, lineName, OBJPROP_TEXT, "Partial TP1 - 50%");
   
   Alert("Partial TP line created. Drag to adjust.");
}

//+------------------------------------------------------------------+
//| Check auto breakeven triggers                                    |
//+------------------------------------------------------------------+
void CheckAutoBreakevenTriggers()
{
   if(!InpAutoBreakeven) return;
   
   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if(!OrderSelect(i, SELECT_BY_POS)) continue;
      if(OrderMagicNumber() != MAGIC_NUMBER) continue;
      if(OrderSymbol() != _Symbol) continue;
      
      double profitPips = 0;
      double entryPrice = OrderOpenPrice();
      double currentPrice = (OrderType() == OP_BUY) ? Bid : Ask;
      
      if(OrderType() == OP_BUY)
         profitPips = (currentPrice - entryPrice) / (_Point * 10);
      else
         profitPips = (entryPrice - currentPrice) / (_Point * 10);
      
      if(profitPips >= InpBreakevenPips)
      {
         if((OrderType() == OP_BUY && OrderStopLoss() < entryPrice) ||
            (OrderType() == OP_SELL && OrderStopLoss() > entryPrice))
         {
            MoveSLtoBreakeven();
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Check partial TP triggers                                        |
//+------------------------------------------------------------------+
void CheckPartialTPTriggers()
{
   // Implementation for partial TP trigger checking
   // Would iterate through g_PartialTP_Triggers array
}

//+------------------------------------------------------------------+
//| Open Trade Dialog                                                |
//+------------------------------------------------------------------+
void OpenTradeDialog()
{
   ActivateSmartOpen();
}
