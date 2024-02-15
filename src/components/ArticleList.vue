<template>
	<div class="article-list-ctn scrolling-y" :class="{'FULL': isDesktop}">
		<div class="flex-col pd5">
			<!-- 文章列表 -->
			<div class="article-paper-ctn flex-col pdtb3" v-for="obj in sortList" @click="onClickArticle(obj)">
				<div class="flex-1 flex-row">
					<!-- 文章主題 -->
					<div class="flex-1 font-size-mini">{{obj.name}}</div>
					<!-- 文章簡圖 -->
					<div class="img-ctn mgl2" :style="`background-image: url('${obj.url_rep_img}')`"></div>
				</div>
				<!-- 作者/時間/閱讀數... -->
				<ArticleInfoRow :param="obj" />
			</div>
			<!-- 最下方 -->
			<div class="flex-center mgt5">
				<Button v-if="haveNext" class="mgtb5 pdlr5" @click="onBtnGetMore">
					<i class="material-icons md-24 mgr3 clr-orange tcef">cloud_download</i>{{$ln(`更多`)}}
				</Button>
				<span v-if="!haveNext" class="clr-gray2">{{$ln(`-- 已无更多资料 --`)}}</span>
			</div>
			<LoadingIcon v-if="isLoading"></LoadingIcon>
		</div>
	</div>
</template>

<script>
import ArticleContent from "@/components/ArticleContent.vue";
import ArticleInfoRow from "@/components/ArticleInfoRow.vue";
export default {
	props: ["param"],
	data() {
		return {
			result: {},
		}
	},
	beforeMount() {
		M4C.Article.resetPager(this.param.tag);
		this.result = M4C.Article.queryArticleList(this.param.tag, true);
	},
    mounted() {},
	beforeDestroy() {},
	components: {
		ArticleInfoRow,
	},
    methods: {
		onClickArticle(obj) {
			eventBus.$emit("POPUP-DIALOG", ArticleContent, {auth_key: obj.auth_key}, {transName: 'float'});
		},
		onBtnGetMore() {
			this.result = M4C.Article.queryArticleList(this.param.tag);
		},
	},
	watch: {
		// '$store.state.status.pause': function(nv){
		// 	// 從暫停狀態中恢復/Resume
		// 	if (!nv) {
		// 		this.result = M4C.Article.queryArticleList(this.param.tag);
		// 	}
		// },
		/** 報價登入完成 */
		'$store.state.wsConnMap.quote.loginReady': function(nv) {
			if (nv) {
				this.result = M4C.Article.queryArticleList(this.param.tag);
			}
		},
	},
    computed: {
		isDesktop() {
			return this.$store.state.device.isDesktop;
		},
		sortList() {
			return this.articleList.sort((a, b) => {
				return new Date(b.updated_at.split('.')[0].replace(/-/g, "/")).getTime() - new Date(a.updated_at.split('.')[0].replace(/-/g, "/")).getTime();
			});
		},
		articleList() {
			return this.$store.state.article[this.param.tag].list;
		},
		isLoading() {
			return this.result ? this.result.$STATUS === "QUERY" : false;
		},
		// 是否仍有下一頁
		haveNext() {
			return this.$store.state.article[this.param.tag].pager.hn;
		},
	},
}
</script>

<style scoped>
.article-list-ctn {
	min-height: 500px;
}
.article-paper-ctn {
	border-bottom: 1px solid rgb(42 53 66);
}
/** 縮圖 */
.img-ctn {
	width: 22vw;
	height: 22vw;
	border: 1px solid #222;
	border-radius: 2vw;
	/** 填滿 */
	/* background-repeat: round; */
	/** 置中 */
	background-size: 22vw;
    background-repeat: no-repeat;
    background-position: center;
}

/** 桌机版 */
.desktop .article-list-ctn {
	min-height: auto;
}
/** 縮圖 */
.desktop .img-ctn {
	width: 4.4em;
	height: 4.4em;
	border-radius: 0.4em;
	background-size: 4.4em;
}
.desktop .article-paper-ctn:hover {
	color: aqua;
	cursor: pointer;
}
</style>