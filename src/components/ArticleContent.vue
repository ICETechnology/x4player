<template>
	<ScrollBounce class="FULL" v-stop-propagation-y>
		<div class="article-content-ctn flex-col pdlr5 overflow-hidden">
			<!-- 文章標題 -->
			<div class="mgb5 rd2 font-size-large">{{title}}</div>
			<!-- 作者/時間/閱讀數... -->
			<ArticleInfoRow v-if="article" class="mgb1" :param="article" />
			<!-- 內文 -->
			<div ref="contentCtn" class="content images" :class="[articleContentFontSize]" v-html="content" v-viewer="options"></div>
			<LoadingIcon v-if="isLoading"></LoadingIcon>
		</div>
		<!-- v-viewer -->
		<viewer :images="images">
			<img v-for="src in images" :src="src" :key="src">
		</viewer>
	</ScrollBounce>
</template>

<script>
import 'viewerjs/dist/viewer.css'
import Viewer from 'v-viewer'
import Vue from 'vue'
Vue.use(Viewer)

// 對文章內容進行擴增/取代/增強
import ArticleContentEnhance from '@/components/ArticleContentEnhance';
import OptCloudDialog from "@/components/OptCloudDialog.vue";
import ArticleInfoRow from "@/components/ArticleInfoRow.vue";

export default {
	mixins: [ArticleContentEnhance],
	props: ["param"],
	data() {
		return {
			/** 查詢文章結果 */
			articleResult: {},
			/** 查詢回來的文章內文 */
			articleContent: "",
			displayCloseIcon: true,

			/** v-viewer 固定需要此變數 */
			images: [],
			/** v-viewer 的選項 (放到 beforeMount 是因為需要 self.$store) */
			options: {},
			/** 文章物件 */
			article: null,	
		}
	},
	beforeMount() {
		let self = this;
		this.options = {
			title: false,
			navbar: false,
			toolbar: false,
			show(e) {self.$store.state.sync.floatDialogCloseIcon = false;},
			hide(e) {self.$store.state.sync.floatDialogCloseIcon = true;},
		};
		if (this.isDesktop)
			this.$emit('dialogClass', `dialog-size-big`);
	},
    mounted() {
		this.articleResult = M4C.Article.queryArticleContent(this.auth_key);
		// 解除鎖定
		screen.orientation.unlock();
		// 移除要求要自動彈出的文章代號
		delete this.$store.state.status.popupArticleAuthKey;
		this.$emit('fontSizeAdjust', true);
	},
	beforeDestroy() {
		// 鎖定直向
		window.lockScreen('portrait');
	},
	components: {
		ArticleInfoRow,
	},
    methods: {
		popupOptCloud(data) {
			eventBus.$emit("POPUP-DIALOG", OptCloudDialog, {clsName: "OptCloudDialog", id: data.id, name: data.name});
		},
	},
	watch: {
		'articleResult.$STATUS': function(nv) {
			if (nv === "DONE") {
				try{
					this.article = this.articleResult.$D;
					this.articleContent = this.articleResult.$D.rsrc.content;
				}catch(err){}
			}
		},
	},
    computed: {
		isDesktop() {
			return this.$store.state.device.isDesktop;
		},
		title() {
			try {return this.article.name || this.articleResult.$D.name;}catch(err){}
		},
		/** 是否顯示 loading-icon */
		isLoading() {
			if (this.articleResult.$STATUS === "QUERY")		return true;
			return false;
		},
		articleContentFontSize() {
			return "font-size-" + this.$store.state.config.articleContentFontSize;
		},
		/** 驗證碼 */
		auth_key() {
			// 不曉得什麼原因，驗證碼在不同位置
			return this.param.auth_key || this.param.article.auth_key;
		}
	},
}
</script>

<style scoped>
.content {
	color: #9498AF;
}
.content >>> img {
	max-width: 90vw;
	height: auto;
	object-fit: contain;
}
.content >>> .oc-link {
	color:aqua;
	text-decoration: underline;
}
.content >>> .a-link {
	color:aqua;
	text-decoration: underline;
}
</style>