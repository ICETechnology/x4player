<template>
    <div class="article-ctn flex-center font-size-little">
		<TabGroup v-if="tabList.length > 0" ref="tg" class="" :selectedIdx="0" :tabList="tabList"
			:tabKey="`TG-Article`" stretch="true" :class="{'FULL': isDesktop}" :fixHead="true" />
    </div>
</template>

<script>
import ArticleList from "@/components/ArticleList.vue";
export default {
	props: [],
	data() {
		return {
			tagList: M4C.Article.queryTag(),
		}
	},
	beforeMount() {},
    mounted() {
	},
	beforeDestroy() {},
	components: {
		ArticleList,
	},
    methods: {},
	watch: {
		// 報價連線登入完成 -> 重補 tag 以免空畫面
		'$store.state.wsConnMap.quote.loginReady'(nv) {
			if (nv) {
				console.log('Article.watch->quote.loginReady');
				this.tagList = M4C.Article.queryTag();
			}
		},
	},
    computed: {
		isDesktop() {
			return this.$store.state.device.isDesktop;
		},
		tabList() {
			return this.tagList.map((tag)=>{
				return {
					comClass: ArticleList,
					label: tag,
					param: {
						'tag': tag,
					},
				};
			});
		},
	},
}
</script>

<style scoped>
.article-ctn /deep/ .head {
	/* background: none; */
}
.article-ctn /deep/ .head .tab {
	border-bottom-color: rgba(0,0,0,0);
}
</style>