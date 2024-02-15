export default {
	data: function () {
		return {
			/** 當前展開哪筆委託 (各委託展開互斥) */
			expandRptKey: "",
		}
	},
	methods: {
		onExpand(rptKey, cardCtn) {
			this.expandRptKey = rptKey;
			// 內容展開後超過螢幕的自動捲動校正機制 (延遲為了讓 expand 內容建立好)
			setTimeout((self)=>{
				let el = self.$refs.sb.$el.querySelector('.scroll-bounce-ctn');
				// 讓卡片內容可顯示完全 (ScrollBounce 裡，隱藏的 ReflashCtn 佔高 75px)
				let top = cardCtn.offsetTop + cardCtn.clientHeight - (el.clientHeight - 75);
				// 新的Top不可超過原卡片的Top，確保原卡片最多被頂到最上方
				top = top > cardCtn.offsetTop ? cardCtn.offsetTop : top;
				// 展開僅准自動往下方捲動
				el.scrollTop = top > el.scrollTop ? top : el.scrollTop;
			}, 100, this);
		},
		onRefresh() {
			M4C.Report.queryReport();
		},
	},
	watch: {
		/** 資料數量變化時要重設 expandRptKey (以免下一列的商品被展開) */
		reportList(nv, ov) {
			this.expandRptKey = "";
		},
	},
	computed: {
		stampStatus() {
			return this.$store.state.result.queryReportResult.$STATUS;
		},
	}
}