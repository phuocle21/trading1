"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";

// Định nghĩa các ngôn ngữ được hỗ trợ
export type Language = "en" | "vi";

// Định nghĩa kiểu dữ liệu cho translations
export type Translations = {
  [key: string]: {
    en: string;
    vi: string;
  };
};

// Tạo translations với các text phổ biến
export const translations: Translations = {
  dashboard: {
    en: "Dashboard",
    vi: "Bảng điều khiển",
  },
  "dashboard.title": {
    en: "Dashboard",
    vi: "Bảng điều khiển",
  },
  addTrade: {
    en: "Add Trade",
    vi: "Thêm giao dịch",
  },
  history: {
    en: "History",
    vi: "Lịch sử",
  },
  "tradeHistory.title": {
    en: "Trade History",
    vi: "Lịch Sử Giao Dịch"
  },
  "tradeHistory.description": {
    en: "View and manage all your trading activity",
    vi: "Xem và quản lý tất cả hoạt động giao dịch của bạn"
  },
  "tradeHistory.searchPlaceholder": {
    en: "Search trades...",
    vi: "Tìm kiếm giao dịch..."
  },
  "tradeHistory.newTrade": {
    en: "New Trade",
    vi: "Giao Dịch Mới"
  },
  "tradeHistory.openTrades": {
    en: "Open Trades",
    vi: "Giao Dịch Mở"
  },
  "tradeHistory.closedTrades": {
    en: "Closed Trades",
    vi: "Giao Dịch Đóng"
  },
  "tradeHistory.winRate": {
    en: "Win Rate",
    vi: "Tỷ Lệ Thắng"
  },
  "tradeHistory.totalPL": {
    en: "Total P/L",
    vi: "Tổng Lãi/Lỗ"
  },
  "tradeHistory.allTrades": {
    en: "All Trades",
    vi: "Tất Cả GD"
  },
  "tradeHistory.open": {
    en: "Open",
    vi: "Đang Mở"
  },
  "tradeHistory.closed": {
    en: "Closed",
    vi: "Đã Đóng"
  },
  "tradeHistory.columns": {
    en: "Columns",
    vi: "Cột"
  },
  "tradeHistory.noopenTradesFound": {
    en: "No open trades found",
    vi: "Không tìm thấy giao dịch mở nào"
  },
  "tradeHistory.noclosedTradesFound": {
    en: "No closed trades found",
    vi: "Không tìm thấy giao dịch đóng nào"
  },
  "tradeHistory.noOpenTradesMessage": {
    en: "You don't have any open trades. Add a trade without an exit date.",
    vi: "Bạn không có giao dịch mở nào. Thêm giao dịch không có ngày thoát."
  },
  "tradeHistory.noClosedTradesMessage": {
    en: "You don't have any closed trades. Add exit information to your open trades.",
    vi: "Bạn không có giao dịch đóng nào. Thêm thông tin thoát cho các giao dịch mở của bạn."
  },
  "tradeHistory.noResultsFound": {
    en: "No results found",
    vi: "Không tìm thấy kết quả"
  },
  "tradeHistory.noMatchingTrades": {
    en: "No trades match your search criteria",
    vi: "Không có giao dịch nào khớp với tiêu chí tìm kiếm của bạn"
  },
  "tradeHistory.clearFilters": {
    en: "Clear filters",
    vi: "Xóa bộ lọc"
  },
  "tradeHistory.showing": {
    en: "Showing {filtered} of {total} trades",
    vi: "Hiển thị {filtered} trong tổng số {total} giao dịch"
  },
  "tradeHistory.noTradesYet": {
    en: "No Trades Yet",
    vi: "Chưa Có Giao Dịch Nào"
  },
  "tradeHistory.startByAdding": {
    en: "Start by adding your first trade to see your history.",
    vi: "Bắt đầu bằng cách thêm giao dịch đầu tiên để xem lịch sử của bạn."
  },
  "tradeHistory.addNewTrade": {
    en: "Add New Trade",
    vi: "Thêm Giao Dịch Mới"
  },
  "tradeForm.title.add": {
    en: "Add Trade",
    vi: "Thêm Giao Dịch",
  },
  "tradeForm.title.edit": {
    en: "Edit Trade",
    vi: "Sửa Giao Dịch",
  },
  "app.name": {
    en: "Trading Journal",
    vi: "Nhật ký Giao dịch",
  },
  "button.addTrade": {
    en: "Add Trade",
    vi: "Thêm Giao Dịch",
  },
  settings: {
    en: "Settings",
    vi: "Cài đặt",
  },
  account: {
    en: "Account",
    vi: "Tài khoản",
  },
  language: {
    en: "Language",
    vi: "Ngôn ngữ",
  },
  english: {
    en: "English",
    vi: "Tiếng Anh",
  },
  vietnamese: {
    en: "Vietnamese",
    vi: "Tiếng Việt",
  },
  accountGrowth: {
    en: "Account Growth",
    vi: "Tăng trưởng tài khoản",
  },
  performance: {
    en: "Performance",
    vi: "Hiệu suất",
  },
  winRate: {
    en: "Win Rate",
    vi: "Tỷ lệ thắng",
  },
  profitFactor: {
    en: "Profit Factor",
    vi: "Hệ số lợi nhuận",
  },
  averageWin: {
    en: "Average Win",
    vi: "Lợi nhuận trung bình",
  },
  averageLoss: {
    en: "Average Loss",
    vi: "Thua lỗ trung bình",
  },
  symbol: {
    en: "Symbol",
    vi: "Mã giao dịch",
  },
  entryPrice: {
    en: "Entry Price",
    vi: "Giá vào lệnh",
  },
  exitPrice: {
    en: "Exit Price",
    vi: "Giá thoát lệnh",
  },
  direction: {
    en: "Direction",
    vi: "Hướng",
  },
  size: {
    en: "Size",
    vi: "Khối lượng",
  },
  profit: {
    en: "Profit",
    vi: "Lợi nhuận",
  },
  date: {
    en: "Date",
    vi: "Ngày",
  },
  notes: {
    en: "Notes",
    vi: "Ghi chú",
  },
  save: {
    en: "Save",
    vi: "Lưu",
  },
  cancel: {
    en: "Cancel",
    vi: "Hủy",
  },
  "tradeForm.selectPlaybook": {
    en: "Select Playbook",
    vi: "Chọn chiến lược",
  },
  timeframe: {
    en: "Timeframe",
    vi: "Khung thời gian",
  },
  tradeSetup: {
    en: "Trade Setup",
    vi: "Thiết lập giao dịch",
  },
  long: {
    en: "Long",
    vi: "Mua",
  },
  short: {
    en: "Short",
    vi: "Bán",
  },
  "dashboard.welcome": {
    en: "Welcome to Trade Insights!",
    vi: "Chào mừng đến với Trade Insights!"
  },
  "dashboard.noTrades": {
    en: "It looks like you haven't added any trades yet.",
    vi: "Có vẻ như bạn chưa thêm giao dịch nào."
  },
  "dashboard.getStarted": {
    en: "Get started by adding your first trade to see your performance dashboard.",
    vi: "Bắt đầu bằng cách thêm giao dịch đầu tiên để xem bảng điều khiển hiệu suất của bạn."
  },
  "dashboard.addFirstTrade": {
    en: "Add Your First Trade",
    vi: "Thêm Giao Dịch Đầu Tiên"
  },
  "dashboard.loadDemoData": {
    en: "Load Demo Data",
    vi: "Tải Dữ Liệu Mẫu"
  },
  "dashboard.refreshDemoData": {
    en: "Refresh Demo Data",
    vi: "Làm Mới Dữ Liệu Mẫu"
  },
  "dashboard.overview": {
    en: "Overview",
    vi: "Tổng Quan"
  },
  "dashboard.advancedAnalytics": {
    en: "Advanced Analytics",
    vi: "Phân Tích Nâng Cao"
  },
  "dashboard.openPositions": {
    en: "Open Positions",
    vi: "Vị Thế Mở"
  },
  "dashboard.openPositionsMessage": {
    en: "You have {count} open trade(s). Statistics below are based on closed trades only.",
    vi: "Bạn có {count} giao dịch mở. Số liệu thống kê dưới đây chỉ dựa trên các giao dịch đã đóng."
  },
  "dashboard.7days": {
    en: "7 Days",
    vi: "7 Ngày"
  },
  "dashboard.30days": {
    en: "30 Days",
    vi: "30 Ngày"
  },
  "dashboard.90days": {
    en: "90 Days",
    vi: "90 Ngày"
  },
  "dashboard.allTime": {
    en: "All Time",
    vi: "Tất Cả"
  },
  "dashboard.totalPL": {
    en: "Total P/L",
    vi: "Tổng Lãi/Lỗ"
  },
  "dashboard.winRate": {
    en: "Win Rate",
    vi: "Tỷ Lệ Thắng"
  },
  "dashboard.avgTradeDuration": {
    en: "Avg. Trade Duration",
    vi: "Thời Gian Giao Dịch TB"
  },
  "dashboard.days": {
    en: "days",
    vi: "ngày"
  },
  "dashboard.totalClosedTrades": {
    en: "Total Closed Trades",
    vi: "Tổng Giao Dịch Đã Đóng"
  },
  "dashboard.winningTrades": {
    en: "Winning Trades",
    vi: "Giao Dịch Thắng"
  },
  "dashboard.losingTrades": {
    en: "Losing Trades",
    vi: "Giao Dịch Thua"
  },
  "dashboard.viewAdvancedAnalytics": {
    en: "View Advanced Analytics",
    vi: "Xem Phân Tích Nâng Cao"
  },
  "dashboard.manageJournals": {
    en: "Manage Journals",
    vi: "Quản lý Nhật ký"
  },
  "trade.date": {
    en: "Date",
    vi: "Ngày"
  },
  "trade.entryTime": {
    en: "Entry Time",
    vi: "Giờ Vào"
  },
  "trade.exitTime": {
    en: "Exit Time",
    vi: "Giờ Ra"
  },
  "trade.symbol": {
    en: "Symbol",
    vi: "Mã CP"
  },
  "trade.direction": {
    en: "Direction",
    vi: "Hướng"
  },
  "trade.long": {
    en: "Long",
    vi: "Mua"
  },
  "trade.short": {
    en: "Short",
    vi: "Bán"
  },
  "trade.quantity": {
    en: "Quantity",
    vi: "Số Lượng"
  },
  "trade.price": {
    en: "Price",
    vi: "Giá"
  },
  "trade.stopLoss": {
    en: "Stop Loss",
    vi: "Dừng Lỗ"
  },
  "trade.takeProfit": {
    en: "Take Profit",
    vi: "Chốt Lời"
  },
  "trade.fees": {
    en: "Fees",
    vi: "Phí"
  },
  "trade.setup": {
    en: "Setup",
    vi: "Mô Hình"
  },
  "trade.risk": {
    en: "Risk",
    vi: "Rủi Ro"
  },
  "trade.mood": {
    en: "Mood",
    vi: "Cảm Xúc"
  },
  "trade.rating": {
    en: "Rating",
    vi: "Đánh Giá"
  },
  "trade.pl": {
    en: "P/L",
    vi: "Lãi/Lỗ"
  },
  "trade.editTrade": {
    en: "Edit trade",
    vi: "Sửa giao dịch"
  },
  "trade.deleteTrade": {
    en: "Delete trade",
    vi: "Xóa giao dịch"
  },
  "trade.confirmDeleteTitle": {
    en: "Are you sure?",
    vi: "Bạn có chắc không?"
  },
  "trade.confirmDeleteDescription": {
    en: "This action cannot be undone. This will permanently delete the trade for {symbol}.",
    vi: "Hành động này không thể hoàn tác. Giao dịch cho {symbol} sẽ bị xóa vĩnh viễn."
  },
  "trade.cancel": {
    en: "Cancel",
    vi: "Hủy"
  },
  "trade.delete": {
    en: "Delete",
    vi: "Xóa"
  },
  "pagination.previous": {
    en: "Previous",
    vi: "Trước"
  },
  "pagination.next": {
    en: "Next",
    vi: "Tiếp"
  },
  // Sidebar translations
  "sidebar.dashboard": {
    en: "Dashboard",
    vi: "Bảng điều khiển"
  },
  "sidebar.tradeHistory": {
    en: "Trade History",
    vi: "Lịch sử giao dịch"
  },
  "sidebar.addNewTrade": {
    en: "Add New Trade",
    vi: "Thêm giao dịch mới"
  },
  "sidebar.playbooks": {
    en: "Playbooks",
    vi: "Chiến lược"
  },
  "sidebar.support": {
    en: "Support",
    vi: "Hỗ trợ"
  },
  "sidebar.helpCenter": {
    en: "Help Center",
    vi: "Trung tâm trợ giúp"
  },
  "sidebar.helpDocumentation": {
    en: "Help & Documentation",
    vi: "Trợ giúp & Tài liệu"
  },
  "sidebar.settings": {
    en: "Settings",
    vi: "Cài đặt"
  },
  "sidebar.collapseSidebar": {
    en: "Collapse Sidebar",
    vi: "Thu gọn thanh bên"
  },
  "sidebar.expandSidebar": {
    en: "Expand Sidebar",
    vi: "Mở rộng thanh bên"
  },
  "sidebar.journals": {
    en: "Journals",
    vi: "Nhật ký"
  },
  "sidebar.mainNavigation": {
    en: "Main Navigation",
    vi: "Điều hướng chính"
  },
  "sidebar.quickActions": {
    en: "Quick Actions",
    vi: "Thao tác nhanh"
  },
  // Trade Form
  "tradeForm.description": {
    en: "Record your trade details for better tracking and analysis",
    vi: "Ghi lại chi tiết giao dịch để theo dõi và phân tích tốt hơn"
  },
  "tradeForm.back": {
    en: "Back",
    vi: "Quay lại"
  },
  "tradeForm.tabs.details": {
    en: "Trade Details",
    vi: "Chi tiết Giao dịch"
  },
  "tradeForm.tabs.psychology": {
    en: "Psychology & Notes",
    vi: "Tâm lý & Ghi chú"
  },
  "tradeForm.detailsDescription": {
    en: "Complete all required fields with accurate information for better trade analysis. Add detailed entry and exit times to track market timing.",
    vi: "Hoàn tất tất cả các trường bắt buộc với thông tin chính xác để phân tích giao dịch tốt hơn. Thêm thời gian vào và ra chi tiết để theo dõi thời điểm thị trường."
  },
  "tradeForm.stockInfo": {
    en: "Stock Information",
    vi: "Thông tin Chứng khoán"
  },
  "tradeForm.stockSymbol": {
    en: "Stock Symbol",
    vi: "Mã Chứng khoán"
  },
  "tradeForm.stockSymbolPlaceholder": {
    en: "e.g., AAPL, MSFT",
    vi: "ví dụ: VCB, FPT"
  },
  "tradeForm.tradeDirection": {
    en: "Trade Direction",
    vi: "Hướng Giao dịch"
  },
  "tradeForm.selectTradeType": {
    en: "Select trade type",
    vi: "Chọn loại giao dịch"
  },
  "tradeForm.buyLong": {
    en: "Buy (Long)",
    vi: "Mua (Long)"
  },
  "tradeForm.sellShort": {
    en: "Sell (Short)",
    vi: "Bán (Short)"
  },
  "tradeForm.entryInfo": {
    en: "Entry Information",
    vi: "Thông tin Mở lệnh"
  },
  "tradeForm.entryDate": {
    en: "Entry Date",
    vi: "Ngày Mở lệnh"
  },
  "tradeForm.entryTime": {
    en: "Entry Time",
    vi: "Thời gian Mở lệnh"
  },
  "tradeForm.whyTrackTime": {
    en: "Why track entry time?",
    vi: "Tại sao phải theo dõi thời gian mở lệnh?"
  },
  "tradeForm.timeTrackingBenefits": {
    en: "Recording entry times helps identify patterns in your trading and optimal market hours for your strategy.",
    vi: "Ghi lại thời gian mở lệnh giúp xác định mô hình trong giao dịch của bạn và thời gian thị trường tối ưu cho chiến lược của bạn."
  },
  "tradeForm.quantity": {
    en: "Quantity",
    vi: "Số lượng"
  },
  "tradeForm.quantityPlaceholder": {
    en: "e.g., 100",
    vi: "ví dụ: 100"
  },
  "tradeForm.entryPrice": {
    en: "Entry Price",
    vi: "Giá Mở lệnh"
  },
  "tradeForm.pricePlaceholder": {
    en: "e.g., 150.25",
    vi: "ví dụ: 150.25"
  },
  "tradeForm.exitInfo": {
    en: "Exit Information",
    vi: "Thông tin Đóng lệnh"
  },
  "tradeForm.exitDate": {
    en: "Exit Date (Optional)",
    vi: "Ngày Đóng lệnh (Tùy chọn)"
  },
  "tradeForm.pickExitDate": {
    en: "Pick an exit date",
    vi: "Chọn ngày đóng lệnh"
  },
  "tradeForm.exitTime": {
    en: "Exit Time (Optional)",
    vi: "Thời gian Đóng lệnh (Tùy chọn)"
  },
  "tradeForm.exitPrice": {
    en: "Exit Price (Optional)",
    vi: "Giá Đóng lệnh (Tùy chọn)"
  },
  "tradeForm.riskManagement": {
    en: "Risk Management",
    vi: "Quản lý Rủi ro"
  },
  "tradeForm.stopLossPrice": {
    en: "Stop Loss Price (Optional)",
    vi: "Giá Cắt lỗ (Tùy chọn)"
  },
  "tradeForm.stopLossDesc": {
    en: "Price at which you planned to exit if trade went against you",
    vi: "Giá mà bạn đã dự định thoát nếu giao dịch đi ngược lại bạn"
  },
  "tradeForm.takeProfitPrice": {
    en: "Take Profit Price (Optional)",
    vi: "Giá Chốt lời (Tùy chọn)"
  },
  "tradeForm.takeProfitDesc": {
    en: "Target price for taking profits",
    vi: "Giá mục tiêu để chốt lời"
  },
  "tradeForm.tradingFees": {
    en: "Trading Fees (Optional)",
    vi: "Phí Giao dịch (Tùy chọn)"
  },
  "tradeForm.feesPlaceholder": {
    en: "e.g., 5.00",
    vi: "ví dụ: 5.00"
  },
  "tradeForm.feesDesc": {
    en: "Commission, exchange fees, etc.",
    vi: "Hoa hồng, phí sàn, v.v."
  },
  "tradeForm.psychologyDescription": {
    en: "Recording your psychology and setup helps identify patterns in your trading behavior and improve decision-making.",
    vi: "Ghi lại tâm lý và thiết lập của bạn giúp xác định mô hình trong hành vi giao dịch và cải thiện việc ra quyết định."
  },
  "tradeForm.tradingSetup": {
    en: "Trading Setup",
    vi: "Thiết lập Giao dịch"
  },
  "tradeForm.setupPattern": {
    en: "Trade Setup/Pattern (Optional)",
    vi: "Mô hình/Thiết lập Giao dịch (Tùy chọn)"
  },
  "tradeForm.selectPattern": {
    en: "Select trading pattern",
    vi: "Chọn mô hình giao dịch"
  },
  "tradeForm.patterns.breakout": {
    en: "Breakout",
    vi: "Breakout (Bứt phá)"
  },
  "tradeForm.patterns.pullback": {
    en: "Pullback",
    vi: "Pullback (Điều chỉnh)"
  },
  "tradeForm.patterns.trendFollowing": {
    en: "Trend Following",
    vi: "Theo xu hướng"
  },
  "tradeForm.patterns.reversal": {
    en: "Reversal",
    vi: "Đảo chiều"
  },
  "tradeForm.patterns.gapFill": {
    en: "Gap Fill",
    vi: "Lấp khoảng trống"
  },
  "tradeForm.patterns.supportResistance": {
    en: "Support/Resistance",
    vi: "Hỗ trợ/Kháng cự"
  },
  "tradeForm.patterns.earningsPlay": {
    en: "Earnings Play",
    vi: "Công bố lợi nhuận"
  },
  "tradeForm.patterns.newsEvent": {
    en: "News/Event",
    vi: "Tin tức/Sự kiện"
  },
  "tradeForm.patterns.other": {
    en: "Other",
    vi: "Khác"
  },
  "tradeForm.setupDesc": {
    en: "Pattern or setup that prompted this trade",
    vi: "Mô hình hoặc thiết lập dẫn đến giao dịch này"
  },
  "tradeForm.riskLevel": {
    en: "Risk Level (Optional)",
    vi: "Mức độ Rủi ro (Tùy chọn)"
  },
  "tradeForm.selectRiskLevel": {
    en: "Select risk level",
    vi: "Chọn mức độ rủi ro"
  },
  "tradeForm.riskLevels.low": {
    en: "Low Risk",
    vi: "Rủi ro Thấp"
  },
  "tradeForm.riskLevels.medium": {
    en: "Medium Risk",
    vi: "Rủi ro Trung bình"
  },
  "tradeForm.riskLevels.high": {
    en: "High Risk",
    vi: "Rủi ro Cao"
  },
  "tradeForm.riskLevelDesc": {
    en: "Your perceived risk level for this trade",
    vi: "Mức độ rủi ro bạn cảm nhận cho giao dịch này"
  },
  "tradeForm.psychology": {
    en: "Psychology",
    vi: "Tâm lý"
  },
  "tradeForm.yourMood": {
    en: "Your Mood (Optional)",
    vi: "Tâm trạng của bạn (Tùy chọn)"
  },
  "tradeForm.howWereYouFeeling": {
    en: "How were you feeling?",
    vi: "Bạn cảm thấy thế nào?"
  },
  "tradeForm.moods.calm": {
    en: "Calm",
    vi: "Bình tĩnh"
  },
  "tradeForm.moods.excited": {
    en: "Excited",
    vi: "Phấn khích"
  },
  "tradeForm.moods.anxious": {
    en: "Anxious",
    vi: "Lo lắng"
  },
  "tradeForm.moods.confident": {
    en: "Confident",
    vi: "Tự tin"
  },
  "tradeForm.moods.unsure": {
    en: "Unsure/Hesitant",
    vi: "Không chắc chắn/Do dự"
  },
  "tradeForm.moodDesc": {
    en: "Your emotional state when entering this trade",
    vi: "Trạng thái cảm xúc của bạn khi tham gia giao dịch này"
  },
  "tradeForm.qualityRating": {
    en: "Quality Rating (Optional)",
    vi: "Đánh giá Chất lượng (Tùy chọn)"
  },
  "tradeForm.ratingDesc": {
    en: "How would you rate the quality of your decision making (1-5)",
    vi: "Bạn đánh giá chất lượng ra quyết định của mình như thế nào (1-5)"
  },
  "tradeForm.tradeNotes": {
    en: "Trade Notes (Optional)",
    vi: "Ghi chú Giao dịch (Tùy chọn)"
  },
  "tradeForm.notesPlaceholder": {
    en: "Why you took this trade, what you observed, lessons learned...",
    vi: "Tại sao bạn thực hiện giao dịch này, những gì bạn quan sát được, bài học kinh nghiệm..."
  },
  "tradeForm.notesDesc": {
    en: "Include key observations and lessons learned",
    vi: "Bao gồm các quan sát chính và bài học kinh nghiệm"
  },
  "tradeForm.cancel": {
    en: "Cancel",
    vi: "Hủy"
  },
  "tradeForm.saveChanges": {
    en: "Save Changes",
    vi: "Lưu Thay đổi"
  },
  "tradeForm.addTrade": {
    en: "Add Trade",
    vi: "Thêm Giao dịch"
  },
  "tradeForm.tradeUpdated": {
    en: "Trade Updated",
    vi: "Giao dịch Đã Cập nhật"
  },
  "tradeForm.tradeUpdatedDesc": {
    en: "Your trade has been successfully updated.",
    vi: "Giao dịch của bạn đã được cập nhật thành công."
  },
  "tradeForm.tradeAdded": {
    en: "Trade Added",
    vi: "Giao dịch Đã Thêm"
  },
  "tradeForm.tradeAddedDesc": {
    en: "New trade successfully recorded.",
    vi: "Giao dịch mới đã được ghi lại thành công."
  },
  // Các mục mới thêm cho TradeForm
  "tradeForm.strategyAndPsychology": {
    en: "Strategy & Psychology",
    vi: "Chiến lược & Tâm lý"
  },
  "tradeForm.choosePlaybook": {
    en: "Choose a playbook",
    vi: "Chọn một chiến lược"
  },
  "tradeForm.playbookDescription": {
    en: "Select a playbook to associate with this trade",
    vi: "Chọn một chiến lược để liên kết với giao dịch này"
  },
  "tradeForm.viewSelectedPlaybook": {
    en: "View selected playbook",
    vi: "Xem chiến lược đã chọn"
  },
  "tradeForm.entryDateTime": {
    en: "Entry Date & Time",
    vi: "Ngày & Giờ Vào Lệnh"
  },
  "tradeForm.exitDateTime": {
    en: "Exit Date & Time",
    vi: "Ngày & Giờ Thoát Lệnh"
  },
  "tradeForm.dateTimeDescription": {
    en: "Format: DD/MM/YYYY HH:MM",
    vi: "Định dạng: DD/MM/YYYY HH:MM"
  },
  // Playbooks Page
  "playbooks.title": {
    en: "Trading Playbooks",
    vi: "Chiến lược Giao dịch"
  },
  "playbooks.description": {
    en: "Document and track your trading strategies to improve consistency",
    vi: "Ghi lại và theo dõi các chiến lược giao dịch của bạn để cải thiện tính nhất quán"
  },
  "playbooks.addPlaybook": {
    en: "Add Playbook",
    vi: "Thêm Chiến lược"
  },
  "playbooks.playbookList": {
    en: "Playbook List",
    vi: "Danh sách Chiến lược"
  },
  "playbooks.editPlaybook": {
    en: "Edit Playbook",
    vi: "Sửa Chiến lược"
  },
  "playbooks.createPlaybook": {
    en: "Create Playbook",
    vi: "Tạo Chiến lược"
  },
  "playbooks.noPlaybooksYet": {
    en: "No playbooks yet",
    vi: "Chưa có chiến lược nào"
  },
  "playbooks.createFirstPlaybook": {
    en: "Create your first trading playbook to document your strategy.",
    vi: "Tạo chiến lược giao dịch đầu tiên của bạn để ghi lại chiến thuật của bạn."
  },
  "playbooks.winRate": {
    en: "Win Rate",
    vi: "Tỷ lệ Thắng"
  },
  "playbooks.avgRR": {
    en: "Avg R/R",
    vi: "Tỷ lệ R/R TB"
  },
  "playbooks.timeframe": {
    en: "Timeframe",
    vi: "Khung thời gian"
  },
  "playbooks.na": {
    en: "N/A",
    vi: "Không có"
  },
  "playbooks.totalTrades": {
    en: "Total Trades",
    vi: "Tổng Giao dịch"
  },
  "playbooks.edit": {
    en: "Edit",
    vi: "Sửa"
  },
  "playbooks.stats": {
    en: "Stats",
    vi: "Thống kê"
  },
  "playbooks.delete": {
    en: "Delete",
    vi: "Xóa"
  },
  "playbooks.createNewPlaybook": {
    en: "Create New Playbook",
    vi: "Tạo Chiến lược Mới"
  },
  "playbooks.documentStrategyDesc": {
    en: "Document your trading strategy with clear rules for setup, entry, and exit.",
    vi: "Ghi lại chiến lược giao dịch của bạn với các quy tắc rõ ràng về thiết lập, mở lệnh và đóng lệnh."
  },
  "playbooks.playbookName": {
    en: "Playbook Name",
    vi: "Tên Chiến lược"
  },
  "playbooks.playbookNamePlaceholder": {
    en: "E.g., Trend Following Breakout",
    vi: "Ví dụ: Breakout Theo Xu hướng"
  },
  "playbooks.selectTimeframe": {
    en: "Select timeframe",
    vi: "Chọn khung thời gian"
  },
  "playbooks.timeframes.1min": {
    en: "1 Minute",
    vi: "1 Phút"
  },
  "playbooks.timeframes.5min": {
    en: "5 Minutes",
    vi: "5 Phút"
  },
  "playbooks.timeframes.15min": {
    en: "15 Minutes",
    vi: "15 Phút"
  },
  "playbooks.timeframes.30min": {
    en: "30 Minutes",
    vi: "30 Phút"
  },
  "playbooks.timeframes.1hour": {
    en: "1 Hour",
    vi: "1 Giờ"
  },
  "playbooks.timeframes.4hour": {
    en: "4 Hours",
    vi: "4 Giờ"
  },
  "playbooks.timeframes.daily": {
    en: "Daily",
    vi: "Hàng ngày"
  },
  "playbooks.timeframes.weekly": {
    en: "Weekly",
    vi: "Hàng tuần"
  },
  "playbooks.timeframes.monthly": {
    en: "Monthly",
    vi: "Hàng tháng"
  },
  "playbooks.strategyDescription": {
    en: "Strategy Description",
    vi: "Mô tả Chiến lược"
  },
  "playbooks.strategyPlaceholder": {
    en: "Briefly describe your trading strategy...",
    vi: "Mô tả ngắn gọn chiến lược giao dịch của bạn..."
  },
  "playbooks.setupCriteria": {
    en: "Setup Criteria",
    vi: "Tiêu chí Thiết lập"
  },
  "playbooks.setupCriteriaPlaceholder": {
    en: "What market conditions or indicators do you look for?",
    vi: "Bạn tìm kiếm những điều kiện thị trường hoặc chỉ báo nào?"
  },
  "playbooks.entryTriggers": {
    en: "Entry Triggers",
    vi: "Tín hiệu Mở lệnh"
  },
  "playbooks.entryTriggersPlaceholder": {
    en: "What signals your entry into the trade?",
    vi: "Điều gì là tín hiệu để bạn mở lệnh giao dịch?"
  },
  "playbooks.exitRules": {
    en: "Exit Rules",
    vi: "Quy tắc Thoát lệnh"
  },
  "playbooks.exitRulesPlaceholder": {
    en: "What are your take profit and stop loss criteria?",
    vi: "Tiêu chí chốt lời và cắt lỗ của bạn là gì?"
  },
  "playbooks.riskManagement": {
    en: "Risk Management",
    vi: "Quản lý Rủi ro"
  },
  "playbooks.riskManagementPlaceholder": {
    en: "Describe your position sizing and risk management rules...",
    vi: "Mô tả quy tắc quản lý rủi ro và xác định khối lượng giao dịch của bạn..."
  },
  "playbooks.additionalNotes": {
    en: "Additional Notes",
    vi: "Ghi chú Bổ sung"
  },
  "playbooks.notesPlaceholder": {
    en: "Any other important information about this strategy...",
    vi: "Bất kỳ thông tin quan trọng nào khác về chiến lược này..."
  },
  "playbooks.cancel": {
    en: "Cancel",
    vi: "Hủy"
  },
  "playbooks.updatePlaybook": {
    en: "Update Playbook",
    vi: "Cập nhật Chiến lược"
  },
  "playbooks.savePlaybook": {
    en: "Save Playbook",
    vi: "Lưu Chiến lược"
  },
  "playbooks.playbookUpdated": {
    en: "Playbook updated",
    vi: "Chiến lược đã cập nhật"
  },
  "playbooks.playbookUpdatedDesc": {
    en: "Successfully updated \"{name}\" playbook.",
    vi: "Đã cập nhật thành công chiến lược \"{name}\"."
  },
  "playbooks.playbookCreated": {
    en: "Playbook created",
    vi: "Chiến lược đã tạo"
  },
  "playbooks.playbookCreatedDesc": {
    en: "Successfully created \"{name}\" playbook.",
    vi: "Đã tạo thành công chiến lược \"{name}\"."
  },
  "playbooks.playbookDeleted": {
    en: "Playbook deleted",
    vi: "Chiến lược đã xóa"
  },
  "playbooks.playbookDeletedDesc": {
    en: "The playbook has been deleted.",
    vi: "Chiến lược đã được xóa."
  },
  // Journal translations
  "journals.title": {
    en: "Trading Journals",
    vi: "Nhật ký Giao dịch"
  },
  "journals.description": {
    en: "Manage your trading journals and track performance separately for different strategies and accounts",
    vi: "Quản lý nhật ký giao dịch và theo dõi hiệu suất riêng cho các chiến lược và tài khoản khác nhau"
  },
  "journals.createNew": {
    en: "Create New",
    vi: "Tạo mới"
  },
  "journals.searchJournals": {
    en: "Search journals...",
    vi: "Tìm kiếm nhật ký..."
  },
  "journals.sort": {
    en: "Sort",
    vi: "Sắp xếp"
  },
  "journals.sortNewest": {
    en: "Newest First",
    vi: "Mới nhất trước"
  },
  "journals.sortOldest": {
    en: "Oldest First",
    vi: "Cũ nhất trước"
  },
  "journals.sortNameAsc": {
    en: "Name A-Z",
    vi: "Tên A-Z"
  },
  "journals.sortNameDesc": {
    en: "Name Z-A",
    vi: "Tên Z-A"
  },
  "journals.sortMostTrades": {
    en: "Most Trades",
    vi: "Nhiều giao dịch nhất"
  },
  "journals.filterButton": {
    en: "Filter",
    vi: "Lọc"
  },
  "journals.allJournals": {
    en: "All Journals",
    vi: "Tất cả nhật ký"
  },
  "journals.activeJournals": {
    en: "Active Journals",
    vi: "Nhật ký đang hoạt động"
  },
  "journals.templates": {
    en: "Templates",
    vi: "Mẫu"
  },
  "journals.noJournalsFound": {
    en: "No journals found",
    vi: "Không tìm thấy nhật ký nào"
  },
  "journals.noJournalsFoundDesc": {
    en: "You don't have any journals yet. Create your first journal to get started.",
    vi: "Bạn chưa có nhật ký nào. Tạo nhật ký đầu tiên để bắt đầu."
  },
  "journals.createFirst": {
    en: "Create First Journal",
    vi: "Tạo nhật ký đầu tiên"
  },
  "journals.trades": {
    en: "Trades",
    vi: "Giao dịch"
  },
  "journals.winRate": {
    en: "Win Rate",
    vi: "Tỷ lệ thắng"
  },
  "journals.openTrades": {
    en: "Open Trades",
    vi: "Giao dịch mở"
  },
  "journals.lastActivity": {
    en: "Last Activity",
    vi: "Hoạt động gần đây"
  },
  "journals.never": {
    en: "Never",
    vi: "Chưa bao giờ"
  },
  "journals.viewDashboard": {
    en: "View Dashboard",
    vi: "Xem bảng điều khiển"
  },
  "journals.switchTo": {
    en: "Switch to Journal",
    vi: "Chuyển đến nhật ký"
  },
  "journals.useTemplate": {
    en: "Use Template",
    vi: "Sử dụng mẫu"
  },
  "journals.template": {
    en: "Template",
    vi: "Mẫu"
  },
  "journals.default": {
    en: "Default",
    vi: "Mặc định"
  },
  "journals.created": {
    en: "Created",
    vi: "Đã tạo"
  },
  "journals.actions": {
    en: "Actions",
    vi: "Hành động"
  },
  "journals.currentlyActive": {
    en: "Currently Active",
    vi: "Đang hoạt động"
  },
  "journals.edit": {
    en: "Edit Journal",
    vi: "Sửa nhật ký"
  },
  "journals.settings": {
    en: "Journal Settings",
    vi: "Cài đặt nhật ký"
  },
  "journals.duplicate": {
    en: "Duplicate Journal",
    vi: "Sao chép nhật ký"
  },
  "journals.delete": {
    en: "Delete Journal",
    vi: "Xóa nhật ký"
  },
  "journals.noActiveJournals": {
    en: "No active journals",
    vi: "Không có nhật ký đang hoạt động"
  },
  "journals.noActiveJournalsDesc": {
    en: "You don't have any active journals yet. Create a new journal to get started.",
    vi: "Bạn chưa có nhật ký đang hoạt động nào. Tạo nhật ký mới để bắt đầu."
  },
  "journals.createJournal": {
    en: "Create Journal",
    vi: "Tạo nhật ký"
  },
  "journals.noTemplatesFound": {
    en: "No templates found",
    vi: "Không tìm thấy mẫu nào"
  },
  "journals.noTemplatesFoundDesc": {
    en: "No template journals available at this time.",
    vi: "Hiện không có mẫu nhật ký nào."
  },
  "journals.currency": {
    en: "Currency",
    vi: "Tiền tệ"
  },
  "journals.initialCapital": {
    en: "Initial Capital",
    vi: "Vốn ban đầu"
  },
  "journals.riskPercentage": {
    en: "Risk Percentage",
    vi: "Tỷ lệ rủi ro"
  },
  "journals.tradingHours": {
    en: "Trading Hours",
    vi: "Giờ giao dịch"
  },
  "journals.confirmDelete": {
    en: "Delete Journal",
    vi: "Xóa nhật ký"
  },
  "journals.confirmDeleteDesc": {
    en: "Are you sure you want to delete this journal? This action cannot be undone.",
    vi: "Bạn có chắc chắn muốn xóa nhật ký này không? Hành động này không thể hoàn tác."
  },
  "journals.warningTitle": {
    en: "Warning",
    vi: "Cảnh báo"
  },
  "journals.warningDesc": {
    en: "Deleting this journal will permanently remove all associated trades and data.",
    vi: "Xóa nhật ký này sẽ xóa vĩnh viễn tất cả giao dịch và dữ liệu liên quan."
  },
  "journals.createNewJournal": {
    en: "Create New Journal",
    vi: "Tạo nhật ký mới"
  },
  "journals.createNewJournalDesc": {
    en: "Give your journal a name and description to help you identify it.",
    vi: "Đặt tên và mô tả cho nhật ký để giúp bạn nhận dạng nó."
  },
  "journals.name": {
    en: "Journal Name",
    vi: "Tên nhật ký"
  },
  "journals.namePlaceholder": {
    en: "e.g., Stock Trading 2025",
    vi: "ví dụ: Giao dịch Cổ phiếu 2025"
  },
  "journals.description": {
    en: "Description (Optional)",
    vi: "Mô tả (Tùy chọn)"
  },
  "journals.descriptionPlaceholder": {
    en: "e.g., My stock trading journal for swing trades",
    vi: "ví dụ: Nhật ký giao dịch cổ phiếu cho các giao dịch swing"
  },
  "journals.icon": {
    en: "Icon",
    vi: "Biểu tượng"
  },
  "journals.selectIcon": {
    en: "Select an icon",
    vi: "Chọn biểu tượng"
  },
  "journals.icons.chart": {
    en: "Chart",
    vi: "Biểu đồ"
  },
  "journals.icons.trendingUp": {
    en: "Trending Up",
    vi: "Xu hướng tăng"
  },
  "journals.icons.activity": {
    en: "Activity",
    vi: "Hoạt động"
  },
  "journals.icons.globe": {
    en: "Globe",
    vi: "Toàn cầu"
  },
  "journals.icons.bitcoin": {
    en: "Bitcoin",
    vi: "Bitcoin"
  },
  "journals.color": {
    en: "Color",
    vi: "Màu sắc"
  },
  "journals.create": {
    en: "Create Journal",
    vi: "Tạo nhật ký"
  },
  "journals.journalCreated": {
    en: "Journal Created",
    vi: "Đã tạo nhật ký"
  },
  "journals.journalCreatedDesc": {
    en: "Your new trading journal has been created successfully.",
    vi: "Nhật ký giao dịch mới của bạn đã được tạo thành công."
  },
  "journals.journalDeleted": {
    en: "Journal Deleted",
    vi: "Đã xóa nhật ký"
  },
  "journals.journalDeletedDesc": {
    en: "Your journal has been successfully deleted.",
    vi: "Nhật ký của bạn đã được xóa thành công."
  },
  "journals.templateCreated": {
    en: "Journal Created from Template",
    vi: "Đã tạo nhật ký từ mẫu"
  },
  "journals.templateCreatedDesc": {
    en: "Your new journal has been created from the template.",
    vi: "Nhật ký mới của bạn đã được tạo từ mẫu."
  },
  "journals.errors.nameRequired": {
    en: "Journal name required",
    vi: "Tên nhật ký là bắt buộc"
  },
  "journals.errors.nameRequiredDesc": {
    en: "Please provide a name for your trading journal.",
    vi: "Vui lòng nhập tên cho nhật ký giao dịch của bạn."
  },
  "journals.errors.cannotDeleteLast": {
    en: "Cannot delete last journal",
    vi: "Không thể xóa nhật ký cuối cùng"
  },
  "journals.errors.cannotDeleteLastDesc": {
    en: "You must have at least one journal. Create a new journal before deleting this one.",
    vi: "Bạn phải có ít nhất một nhật ký. Tạo nhật ký mới trước khi xóa nhật ký này."
  },
  "common.cancel": {
    en: "Cancel",
    vi: "Hủy"
  },
  "common.loading": {
    en: "Loading...",
    vi: "Đang tải..."
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // Default to 'en' initially
  const [language, setLanguage] = useState<Language>("en");

  // Load language from localStorage in useEffect (client-side only)
  useEffect(() => {
    // Now we're in the browser, we can safely access localStorage
    const savedLanguage = localStorage.getItem("language") as Language;
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Hàm này sẽ lưu ngôn ngữ vào localStorage và cập nhật state
  const handleSetLanguage = (newLanguage: Language) => {
    // Lưu vào localStorage
    try {
      localStorage.setItem("language", newLanguage);
      console.log(`Language changed to: ${newLanguage}`);
    } catch (error) {
      console.error("Error saving language to localStorage:", error);
    }
    
    // Cập nhật state
    setLanguage(newLanguage);
  };

  // Hàm dịch
  const t = (key: string): string => {
    // Kiểm tra nếu key tồn tại trực tiếp
    if (translations[key]) {
      return translations[key][language];
    }
    
    // Try to handle nested keys (e.g., "tradeForm.selectPlaybook")
    const parts = key.split('.');
    if (parts.length > 1) {
      let currentObj = translations;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
          // Last part should be the actual key
          if (currentObj[part]) {
            return currentObj[part][language];
          }
        } else {
          // Navigate to nested object
          if (currentObj[part]) {
            currentObj = currentObj[part];
          } else {
            break;
          }
        }
      }
    }
    
    // Hiển thị cảnh báo trong console và trả về key gốc
    console.warn(`Translation key "${key}" not found.`);
    return key;
  };

  const value = {
    language,
    setLanguage: handleSetLanguage,
    t,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

// Hook để sử dụng context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};