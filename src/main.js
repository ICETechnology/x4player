import '@/lib/Date.prototype'
import '@/lib/String.prototype'
import '@/lib/Base64'
import '@/m4core/lz.string.1.3.3.min2'
import '@/m4core/localStorage.extend'
import '@/m4core/pbkdf2.sha256.hex2a'
import '@/m4core/big'
import '@/deviceready'

import '@/css/flex.css'
import '@/css/index.css'

import Vue from 'vue'
import '@/vue.directive'

// vue-resource (use by vue.$http)
import VueResource from 'vue-resource'
Vue.use(VueResource)

// for Scrolling Animation
var VueScrollTo = require('vue-scrollto');
Vue.use(VueScrollTo)

// regenerator-runtime
import "regenerator-runtime/runtime.js";

/** 滾動監聽 */
import VueWaypoint from 'vue-waypoint'
Vue.use(VueWaypoint);

// 全域函式 (會套用在所有 components 裡)
import GlobalFn from '@/global.fn.js'
Vue.mixin(GlobalFn); 

import VTooltip from 'v-tooltip'
Vue.use(VTooltip)

// 簡轉繁API
window.$convert = require('chinese_convert')

// 全域 event 載具
window.eventBus = new Vue();

// 台灣模式
window.twMode = window.prod === 'fftw' || window.prod === 'x4';
// 簽章公司 (台網Changing/全景TWCA)
window.certMode = window.comp === 'taishin' ? 'Changing' : 'TWCA';

// 專案設定檔
Vue.component('Config', require(`@/projects/${window.projectID}/Config.vue`).default)
// 登入畫面
Vue.component('LoginMember', require(`@/projects/${window.projectID}/LoginMember.vue`).default)
// 憑證管理元件
Vue.component('CertManager', require(`@/projects/${window.projectID}/CertManager.vue`).default)
// 憑證核心 (台網/全景)
Vue.component('M4C_Cert', require(`@/m4core/M4C.Cert.${window.certMode}.vue`).default)

// 全域組件
Vue.component('Main', require('@/components/Framework/Main.vue').default)
Vue.component('AppVersionChecker', require('@/components/AppVersionChecker.vue').default)
Vue.component('QuoteLoginer', require('@/components/QuoteLoginer.vue').default)
Vue.component('LoginTradeAuto', require('@/components/LoginTradeAuto.vue').default)
Vue.component('LoginTradeMix', require('@/components/LoginTradeMix.vue').default)
Vue.component('LoginTradeNew', require('@/components/LoginTradeNew.vue').default)
Vue.component('PasswordInvalid', require('@/components/PasswordInvalid.vue').default)
Vue.component('Notifycation', require('@/components/Notifycation.vue').default)
Vue.component('SubContract', require('@/components/SubContract.vue').default)
Vue.component('PauseResume', require('@/components/Control/PauseResume.vue').default)
Vue.component('PopupDialog', require('@/components/Framework/PopupDialog.vue').default)
Vue.component('PopupFloatDialog', require('@/components/Framework/PopupFloatDialog.vue').default)
Vue.component('Iframe', require('@/components/Framework/Iframe.vue').default)

// Vue核心
Vue.component('M4Core', require('@/m4core/M4Core.vue').default)
Vue.component('M4C', require('@/m4core/M4C.vue').default)
Vue.component('M4C_Decode', require('@/m4core/M4C.Decode.vue').default)
Vue.component('M4C_Console', require('@/m4core/M4C.Console.vue').default)
Vue.component('M4C_AC', require('@/m4core/M4C.AC.vue').default)
Vue.component('M4C_Dispatcher', require('@/m4core/M4C.Dispatcher.vue').default)
Vue.component('M4C_Trader', require('@/m4core/M4C.Trader.vue').default)
Vue.component('M4C_Settlement', require('@/m4core/M4C.Settlement.vue').default)
Vue.component('M4C_SelfGroup', require('@/m4core/M4C.SelfGroup.vue').default)
Vue.component('M4C_Symbol', require('@/m4core/M4C.Symbol.vue').default)
Vue.component('M4C_Quote', require('@/m4core/M4C.Quote.vue').default)
Vue.component('M4C_ChartData', require('@/m4core/M4C.ChartData.vue').default)
Vue.component('M4C_SciChartData', require('@/m4core/M4C.SciChartData.vue').default)
Vue.component('M4C_Order', require('@/m4core/M4C.Order.vue').default)
Vue.component('M4C_Report', require('@/m4core/M4C.Report.vue').default)
Vue.component('M4C_Position', require('@/m4core/M4C.Position.vue').default)
Vue.component('M4C_CombinePosition', require('@/m4core/M4C.CombinePosition.vue').default)
Vue.component('M4C_Margin', require('@/m4core/M4C.Margin.vue').default)
Vue.component('M4C_Warrant', require('@/m4core/M4C.Warrant.vue').default)
Vue.component('M4C_Exercise', require('@/m4core/M4C.Exercise.vue').default)
Vue.component('M4C_AD', require('@/m4core/M4C.AD.vue').default)
Vue.component('M4C_Option', require('@/m4core/M4C.Option.vue').default)
Vue.component('M4C_BankTransfer', require('@/m4core/M4C.BankTransfer.vue').default)
Vue.component('M4C_BGInfo', require('@/m4core/M4C.BGInfo.vue').default)
Vue.component('M4C_Language', require('@/m4core/M4C.Language.vue').default)
Vue.component('M4C_Article', require('@/m4core/M4C.Article.vue').default)
Vue.component('M4C_LoginTrade', require('@/m4core/M4C.LoginTrade.vue').default)
Vue.component('M4C_Analysis', require('@/m4core/M4C.Analysis.vue').default)
Vue.component('M4C_CommonQuery', require('@/m4core/M4C.CommonQuery.vue').default)
Vue.component('M4C_HistoryData', require('@/m4core/M4C.HistoryData.vue').default)
Vue.component('M4C_BTO', require('@/m4core/M4C.BTO.vue').default)
Vue.component('M4C_PdSetting', require('@/m4core/M4C.PdSetting.vue').default)
Vue.component('M4C_RaceDCore', require('@/m4core/M4C.RaceDCore.vue').default)
Vue.component('M4C_Announce', require('@/m4core/M4C.Announce.vue').default)
// Vue.component('M4C_KChartDataCore', require('@/m4core/M4C.KChartDataCore.vue').default)
Vue.component('M4C_ColumnSD', require('@/m4core/M4C.ColumnSD.vue').default)
Vue.component('M4C_IP', require('@/m4core/M4C.IP.vue').default)
Vue.component('M4C_HistoryQuery', require('@/m4core/M4C.HistoryQuery.vue').default)
Vue.component('M4C_GTC', require('@/m4core/M4C.GTC.vue').default)
Vue.component('M4C_Order_Split', require('@/m4core/M4C.Order.Split.vue').default)
Vue.component('M4C_SmoAgreement', require('@/m4core/M4C.SmoAgreement.vue').default)
Vue.component('M4C_Wechat', require('@/m4core/M4C.Wechat.vue').default)
Vue.component('M4C_ServerVersion', require('@/m4core/M4C.ServerVersion.vue').default)
Vue.component('M4C_OTP', require('@/m4core/M4C.OTP.vue').default)
Vue.component('M4C_Http', require('@/m4core/M4C.Http.vue').default)
Vue.component('M4C_Sim', require('@/m4core/M4C.Sim.vue').default)
Vue.component('M4C_ContractSpec', require('@/m4core/M4C.ContractSpec.vue').default)
Vue.component('M4C_FontSize', require('@/m4core/M4C.FontSize.vue').default)
Vue.component('M4C_ContinuousIOC', require('@/m4core/M4C.ContinuousIOC.vue').default)
Vue.component('M4C_PostMessage', require('@/m4core/M4C.PostMessage.vue').default)
Vue.component('M4C_SSLPinning', require('@/m4core/M4C.SSLPinning.vue').default)

// 手機版穿透式採集核心
Vue.component('M4C_TradeAPI', require('@/m4core/M4C.TradeAPI.app.vue').default)
// 問題回報核心
Vue.component('M4C_Issue', require('@/m4core/M4C.Issue.vue').default)
// 期權雲處理核心
Vue.component('OCCore', require('@/components/OptionCloud/OCCore.vue').default)

// 基礎組件
Vue.component('Radio', require('@/components/Framework/Radio.vue').default)
Vue.component('RadioItem', require('@/components/Framework/RadioItem.vue').default)
Vue.component('CheckBox', require('@/components/Framework/CheckBox.vue').default)
Vue.component('Toggle', require('@/components/Framework/Toggle.vue').default)
Vue.component('LoadingIcon', require('@/components/Framework/LoadingIcon.vue').default)
Vue.component('Button', require('@/components/Framework/Button.vue').default)
Vue.component('Dialog', require('@/components/Framework/Dialog.vue').default)
Vue.component('FloatDialog', require('@/components/Framework/FloatDialog.vue').default)
Vue.component('FloatFontSize', require('@/components/Framework/FloatFontSize.vue').default)
Vue.component('SlideUp', require('@/components/Framework/SlideUp.vue').default)
Vue.component('MTable', require('@/components/Framework/MTable.vue').default)
Vue.component('ConfirmDialog', require('@/components/Framework/ConfirmDialog.vue').default)
Vue.component('ConfirmFoot', require('@/components/Framework/ConfirmFoot.vue').default)
Vue.component('SingleSelect', require('@/components/Framework/SingleSelect.vue').default)
Vue.component('SingleSelectDialog', require('@/components/Framework/SingleSelectDialog.vue').default)
Vue.component('ChessBoardSelector', require('@/components/Framework/ChessBoardSelector.vue').default)
Vue.component('ContractSelector', require('@/components/Framework/ContractSelector.vue').default)
Vue.component('ContractSelectorChild', require('@/components/Framework/ContractSelectorChild.vue').default)
Vue.component('FloatPopup', require('@/components/Framework/FloatPopup.vue').default)
Vue.component('FlashMessage', require('@/components/Framework/FlashMessage.vue').default)
Vue.component('SwipeDetection', require('@/components/Framework/SwipeDetection.vue').default)
Vue.component('ScrollBounce', require('@/components/Framework/ScrollBounce.vue').default)
Vue.component('SlideTab', require('@/components/Framework/SlideTab.vue').default)
Vue.component('TabGroup', require('@/components/Framework/TabGroup.vue').default)
Vue.component('LabelText', require('@/components/Framework/LabelText.vue').default)
Vue.component('FavoriteIcon', require('@/components/Framework/FavoriteIcon.vue').default)
Vue.component('AudioHandler', require('@/components/Framework/AudioHandler.vue').default)
Vue.component('AudioOptionCard', require('@/components/Framework/AudioOptionCard.vue').default)
Vue.component('MenuIcon', require('@/components/Framework/MenuIcon.vue').default)
Vue.component('PositionMini', require('@/components/Framework/PositionMini.vue').default)
Vue.component('PositionMicro', require('@/components/Framework/PositionMicro.vue').default)
Vue.component('SideMenuFramework', require('@/components/Framework/SideMenuFramework.vue').default)
Vue.component('SwipeUpContainer', require('@/components/Framework/SwipeUpContainer.vue').default)
Vue.component('ColorSelector', require('@/components/Framework/ColorSelector.vue').default)
Vue.component('ColumnConfigIcon', require('@/components/Framework/ColumnConfigIcon.vue').default)
Vue.component('DragColumn', require('@/components/Framework/DragColumn.vue').default)
Vue.component('DatePick', require('@/components/Framework/DatePick.vue').default)
Vue.component('BlockMessage', require('@/components/Framework/BlockMessage.vue').default)
// 商務元件
Vue.component('MixOptCloud', require('@/components/Mix/mix.opt.cloud.vue').default)
Vue.component('MixMarket', require('@/components/Mix/mix.market.vue').default)
Vue.component('MixTrading', require('@/components/Mix/mix.trading.vue').default)
Vue.component('MixRights', require('@/components/Mix/mix.rights.vue').default)
Vue.component('MixSetting', require('@/components/Mix/mix.setting.vue').default)
// Vue.component('MixChart', require('@/components/MixChart.vue').default)
Vue.component('OptionT', require('@/components/OptionT/OptionT.vue').default)

Vue.component('ExgBtn', require('@/components/ExgBtn.vue').default)
Vue.component('OptionSymbolSelectorBtn', require('@/components/OptionT/OptionSymbolSelectorBtn.vue').default)

Vue.component('MarginSimple', require('@/components/MarginSimple.vue').default)
Vue.component('MarginMini', require('@/components/MarginMini.vue').default)
Vue.component('TChart', require('@/components/TChart.vue').default)
Vue.component('MiniTChart', require('@/components/MiniTChart.vue').default)
Vue.component('StoreFn', require('@/components/StoreFn.vue').default)
Vue.component('StoreManager', require('@/components/StoreManager.vue').default)
Vue.component('MyHead', require('@/components/MyHead.vue').default)
Vue.component('MixHead', require('@/components/MixHead.vue').default)
Vue.component('MixHeadText', require('@/components/MixHeadText.vue').default)
Vue.component('QuoteCard', require('@/components/QuoteCard.vue').default)
Vue.component('QuoteCardExpander', require('@/components/QuoteCardExpander.vue').default)
Vue.component('QuotePage', require('@/components/QuotePage.vue').default)
Vue.component('TvcKbar', require('@/components/TvcKbar.vue').default)
Vue.component('TvcKbarHead', require('@/components/TvcKbarHead.vue').default)
Vue.component('Search', require('@/components/Search.vue').default)
Vue.component('SearchPlus', require('@/components/SearchPlus.vue').default)
Vue.component('SearchStock', require('@/components/SearchStock.vue').default)
Vue.component('SearchFutures', require('@/components/SearchFutures.vue').default)
Vue.component('SearchOption', require('@/components/SearchOption.vue').default)
Vue.component('SearchSelfSelect', require('@/components/SearchSelfSelect.vue').default)
Vue.component('OrderModify', require('@/components/OrderModify.vue').default)
Vue.component('OrderSelect', require('@/components/OrderSelect.vue').default)
Vue.component('CloudDetail', require('@/components/CloudDetail.vue').default)
Vue.component('MixSimplePosMkt', require('@/components/Mix/mix.simple.pos.mkt.vue').default)
Vue.component('StopLoss', require('@/components/StopLoss.vue').default)

// 持倉卡片列表
Vue.component('PositionCardList', require('@/components/PositionCardList.vue').default)
// 組合持倉卡片列表
Vue.component('MixCombinePosition', require('@/components/Mix/mix.combinePosition.vue').default)
// 所有委託回報列表
Vue.component('OrderReportCardList', require('@/components/OrderReportCardList.vue').default)
// 有效委託回報列表
Vue.component('WorkingOrderCardList', require('@/components/WorkingOrderCardList.vue').default)
// 成交回報列表
Vue.component('FilledReportCardList', require('@/components/FilledReportCardList.vue').default)
// 雲端回報列表
Vue.component('CloudReportCardList', require('@/components/Report/CloudReportCardList.vue').default)
// 組合型回報頁簽
Vue.component('MixReportTab', require('@/components/MixReportTab.vue').default)
// 組合型回報內容
Vue.component('MixReportList', require('@/components/MixReportList.vue').default)
// 組合型持倉頁簽
Vue.component('MixPositionTab', require('@/components/MixPositionTab.vue').default)
// 組合型持倉內容
Vue.component('MixPosition', require('@/components/MixPosition.vue').default)

// 資金
Vue.component('Margin', require('@/components/Margin.vue').default)
// 限購額度
Vue.component('MarginPurchaseLimit', require('@/components/Margin_Purchase_Limit.vue').default)
// 改單
Vue.component('OrderModify', require('@/components/OrderModify.vue').default)
// 結算單
Vue.component('Settlement', require('@/components/Settlement.vue').default)
// 商品列 (含各快捷功能按鈕)
Vue.component('SymbolRow', require('@/components/SymbolRow.vue').default)
// 商品名稱與代號
Vue.component('SymbolCNM4', require('@/components/SymbolCNM4.vue').default)
// 商品部位列
Vue.component('SymbolPositionRow', require('@/components/SymbolPositionRow.vue').default)
// 商品行情極簡版
Vue.component('SymbolMiniQ', require('@/components/SymbolMiniQ.vue').default)
// 左側邊滑出選單
Vue.component('SideMenu', require('@/components/SideMenu.vue').default)
// 價格輸入
Vue.component('InputPrice', require('@/components/InputPrice.vue').default)
// 數量(整數)輸入
Vue.component('InputQty', require('@/components/InputQty.vue').default)
// 捲動輸入
Vue.component('ScrollInput', require('@/components/ScrollInput.vue').default)
// 價格/數量 輸入 的 列表選單選擇器
Vue.component('InputSelector', require('@/components/InputSelector.vue').default)
// 浮動下單盒
Vue.component('FloatOrder', require('@/components/FloatOrder.vue').default)
Vue.component('Mixorder', require('@/components/Mix/mix.order.vue').default)

Vue.component('OrderConfirm', require('@/components/OrderConfirm.vue').default)
Vue.component('OrderConfirmOpposite', require('@/components/OrderConfirmOpposite.vue').default)
// 策略下單盒列表
Vue.component('PlotOrderHead', require('@/components/PlotOrder/PlotOrderHead.vue').default)
// 狀態章
Vue.component('Stamp', require('@/components/Stamp.vue').default)
// 已登入交易帳號選擇器
Vue.component('LoginedBTOSelector', require('@/components/LoginedBTOSelector.vue').default)
// 已登入交易帳號管理器
Vue.component('LoginedBTOManager', require('@/components/LoginedBTOManager.vue').default)
Vue.component('LoginedBTOCard', require('@/components/LoginedBTOCard.vue').default)
// 三大提醒
Vue.component('NoticeMSG', require('@/components/NoticeMSG.vue').default)
// 價格別(OrderType)選擇器
Vue.component('OrderTypeSelector', require('@/components/Order/OrderTypeSelector.vue').default)
// 效期別(TimeInForce)選擇器
Vue.component('TimeInForceSelector', require('@/components/Order/TimeInForceSelector.vue').default)
// 下拉器
Vue.component('DragDownCtn', require('@/components/DragDownCtn.vue').default)
// QRCode Scanner
Vue.component('QRScanner', require('@/components/QRScanner.vue').default)
// 更多
Vue.component('ExtraMenu', require('@/components/ExtraMenu.vue').default)
// 截圖中
Vue.component('ScreenShotMask', require('@/components/ScreenShotMask.vue').default)
Vue.component('ConfigColumnSD', require('@/components/ConfigColumnSD.vue').default)
Vue.component('QuoteCardSD', require('@/components/QuoteCardSD.vue').default)
Vue.component('QuoteCardSDHeight', require('@/components/QuoteCardSDHeight.vue').default)

Vue.component('WithdrawalRecord', require('@/components/Accounting/WithdrawalRecord.vue').default)
Vue.component('Withdrawal', require('@/components/Accounting/Withdrawal.vue').default)
Vue.component('CurrencyExchange', require('@/components/Accounting/CurrencyExchange.vue').default)
Vue.component('Exchange', require('@/components/Accounting/Exchange.vue').default)

// 選擇權策略
import '@/m4core/StrategyProfitLossCore/StrategyProfitLossCore'
import '@/m4core/StrategyProfitLossCore/StrategyInterface'
import '@/m4core/StrategyProfitLossCore/JumpStrategy'
import '@/m4core/StrategyProfitLossCore/SinkStrategy'
import '@/m4core/StrategyProfitLossCore/NotFallStrategy'
import '@/m4core/StrategyProfitLossCore/NotRiseStrategy'
import '@/m4core/StrategyProfitLossCore/BullCallSpreadStrategy'
import '@/m4core/StrategyProfitLossCore/BearCallSpreadStrategy'
import '@/m4core/StrategyProfitLossCore/BullPutSpreadStrategy'
import '@/m4core/StrategyProfitLossCore/BearPutSpreadStrategy'
import '@/m4core/StrategyProfitLossCore/BuyStraddlesStrategy'
import '@/m4core/StrategyProfitLossCore/SellStraddlesStrategy'
import '@/m4core/StrategyProfitLossCore/BuyStranglesStrategy'
import '@/m4core/StrategyProfitLossCore/SellStranglesStrategy'
import '@/m4core/StrategyProfitLossCore/ConversionsStrategy'
import '@/m4core/StrategyProfitLossCore/ReversalsStrategy'

import store from '@/store.js'
import App from '@/App.vue'

// 啟動 Vue
window.vue = new Vue({el: '#app', store: store, render: c => c(App)})
  