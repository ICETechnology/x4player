<template>
    <div class="m4c-article hidden" />
</template>

<script>
import M4C_Base from '@/m4core/M4C.Base';
export default {
	mixins: [M4C_Base],
	props: [],
	data() {
		return {
			/** 匹配哪個 r 是哪個 tag (因為 server 回應無法看出是查哪個 tag) */
			mapRKeyToTag: {},
		}
	},
	beforeMount() {
		M4C.Article = this;
		// 註冊資料分派
		M4C.regDispatch({'s': 'rsrc', 'c': 'tag.get', 'callback': this.onTagGet.bind(this)});
		M4C.regDispatch({'s': 'rsrc', 'c': 'txt.latest', 'callback': this.onArticleList.bind(this)});
		M4C.regDispatch({'s': 'rsrc', 'c': 'txt.get', 'callback': this.onArticleContent.bind(this)});
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		// 查詢標籤列表
		queryTag() {
			M4C.send({
				"s": "rsrc",
				"c": "tag.get",
				"r": "".random(),
			});
			return this.baseQuery('DataTag');
		},
		// 查詢文章列表
		queryArticleList(tag, needPage1) {
			let pager = this.$store.state.article[tag].pager;
			pager.pg = pager.pg || 0;
			// needPage1 表示元件啟動時呼叫，若該分類已經有第一頁資料則直接 return
			if (needPage1 && pager.pg >= 1) return;

			let rkey = "".random();
			this.mapRKeyToTag[rkey] = tag;
			
			M4C.send({
				"s": "rsrc",
				"c": "txt.latest",
				"d": {
					"tags": [tag],
					"pager": {
						"pg": pager.pg + 1,
						"sz": 10
					},
				},
				"r": rkey,
			});
			return this.baseQuery(`DataArticleList-${rkey}`);
		},
		// 查詢文章全文
		queryArticleContent(key) {
			M4C.send({
				"s": "rsrc",
				"c": "txt.get",
				"d": {"auth_key": key},
				"r": "".random(),
			});
			return this.baseQuery('DataArticleContent');
		},
		// 重置該分類的文章內容
		resetPager(tag) {
			this.$set(this.$store.state.article, tag, {list: [], pager: {}});
		},
		// ========================= 收到資料 =========================
		// 收到標籤列表
		onTagGet(data) {
			let result = this.baseOnTradeData('DataTag', data);
			if (data.d && data.d.tags) {
				data.d.tags.forEach((tag)=>{
					result.push(tag);
					// 動態加入 vuex 文章分類
					// this.$set(this.$store.state.article, tag, {list: [], pager: {}});
					this.resetPager(tag);
				});
			}
		},
		// 收到文章列表
		onArticleList(data) {
			let rkey = data.r;
			let result = this.baseOnTradeData(`DataArticleList-${rkey}`, data);
			if (data.d && data.d.data) {
				let tag = this.mapRKeyToTag[data.r];
				data.d.data.forEach((obj)=>{
					this.$store.state.article[tag].list.push(obj);
					this.$store.state.article[tag].pager = data.d.pager;
				});
				// 收到即視為查詢完成 (文章特性)
				this.$set(result, "$STATUS", "DONE");
				clearTimeout(result.timeout);
			}
		},
		// 收到文章內容
		onArticleContent(data) {
			let result = this.baseOnTradeData('DataArticleContent', data);
			this.$set(result, "$D", data.d);
			this.$set(result, "$STATUS", "DONE");
		},
	},
	watch: {
		'$store.state.status.pause': function(nv){
			// 進入暫停狀態 -> 清除所有暫存資料 (恢復時要重查最新的)
			// if (nv) {
			// 	for (let tag in this.$store.state.article) {
			// 		this.resetPager(tag);
			// 	}
			// }
		},
	},
    computed: {},
}
</script>

<style scoped>
</style>