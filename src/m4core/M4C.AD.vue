<template>
    <div class="m4c-ad hidden" />
</template>

<script>
export default {
	props: [],
	data() {
		return {
			pageIdx: 0,
			adList: [],
		}
	},
	beforeMount() {
		// 支持 Vuex + Window全域
		M4C.AD = this.$store.state.m4c.ad = this;
		// 註冊資料分派
		M4C.regDispatch({
			's': 'ad',
			'callback': this.onData.bind(this)
		});
	},
    methods: {
		/** 取得響應式的廣告資料列表 */
		queryADList() {
			// 清空
			this.pageIdx = 0;
			this.adList.splice(0);
			// 用來讓元件判斷是否包含更多資料 (預設true)
			this.$set(this.adList, "existMore", true);
			this.getMore();
			this.$store.state.data.adList = this.adList;
		},
		/** 繼續查詢更多 */
		getMore() {
			let cmd = {
				"s": "ad",
				"c": "ad.find",
				"d": {
					"pager": {
						"pg": ++this.pageIdx,
						"sz": 10,
					},
				},
				"r": "".random()
			};
			M4C.send(cmd);
		},
		onData(data) {
			// 查詢失敗
			if (data.cd < 0) {
				M4C.responseChangeLanguage(data, "AD_");
				this.$store.state.notify({type: `error`, body: `(${data.s}/${data.c}) ${data.$MSG}`});
			}
			// 查詢完成
			else if (data.lt) {
				data.d.data.forEach((obj)=>{
					this.adList.push(obj);
				});
				// 已經沒有下一頁時
				if (!data.d.pager.hn) {
					this.adList.existMore = false;
				}
			}
		},
	},
	watch: {},
    computed: {},
}
</script>
