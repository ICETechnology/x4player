<template>
	<div class="announce-content flex-col">
		<div v-if="param.pin" class="pin flex-center pdtb1">
			<!-- 置頂公告標示 -->
			<i class="material-icons">location_on</i>{{$ln('置顶公告')}}</div>
		<div class="flex-1 posr">
			<ScrollBounce v-stop-propagation-y>
				<div class="pdlr5">
					<!-- 公告標題 -->
					<p v-html="contentTitle" class="announce-title-ctn" />
					<!-- 公告發佈時間 -->
					<p v-html="publishTime" class="font-size-small clr-gray3" />
					<!-- 公告內容 -->
					<p v-html="contentData" class="clr-gray"/>
					<!-- 公告連結 -->
					<span class="clr-orange underline mgb1" @click="onClick(link.url)" v-for="(link, index) in contentLink" :key="link">{{ link.name }}</span>			
				</div>
			</ScrollBounce>
		</div>
		<LoadingIcon v-if="isLoading" />
	</div>
</template>

<script>
export default {
	props: ['param'],
	data() {
		return {
			queryContentResult: {},
			contentObject: {},
		}
	},
	beforeMount() {},
    mounted() {
		this.checkContent();
	},
	beforeDestroy() {},
	components: {},
    methods: {
		checkContent() {
			if (!this.param.c && this.param._id) {
				this.queryContentResult = M4C.Announce.queryAnnContent(this.param._id);
			}
			// 外層代入已查詢後的資料時設定已讀
			else if (!this.param.isRead && this.param.c && this.param._id) {
				M4C.Announce.readAnn(this.param._id);
			}
		},
		onClick(url){
			window.openLink(url);
		}
	},
	watch: {
		param(nv) {
			this.checkContent();
		},
		/** 查詢狀態改變 */
		'queryContentResult.$STATUS': function(nv) {
			// this.$store.state.notify(`error`, nv);
			if(nv === 'DONE' && !this.param.isRead) {
				M4C.Announce.readAnn(this.param._id);
			}
		},
	},
    computed: {
		// 公告標題
		contentTitle() {
			try {
				return this.param.s;
			} catch(e) {
				return "";
			}
		},
		// 公告內容
		contentData() {
			switch (this.queryContentResult.$STATUS) {
				case 'QUERY':
					// 清除公告內容
					this.contentObject = {};
					return this.$ln('查询中');
				case 'FAIL':
					return this.$ln('查询失败');
			}
			return this.param.c;
		},
		// 公告連結
		contentLink(){
			try {
				return this.param.links;
			} catch(e) {
				return null;
			}
		},
		publishTime() {
			// 有查到內容才顯示發布時間
			if (this.contentData)
				return `<span>${this.$ln('发布时间')} :　　${this.updateTime}</span>`;
			return '';
		},
		updateTime() {
			try{
				let dateObj = new Date(this.param.aval_at);
				let year = dateObj.getFullYear();
				let dateTime = dateObj.dayTime18().split('/').slice(1).join('/');
				return `${year} ${dateTime}`;
			}catch(e){}
		},
		/** 查詢中 */
		isLoading() {
			return this.queryContentResult.$STATUS === "QUERY";
		},
	},
}
</script>

<style scoped>
/** 預設公告標題字體顏色 */
.announce-title-ctn {
	color: #01609C;
}
.announce-content {
	color: black;
	background-color: white;
}
.pin {
	color: white;
	background-color: red;
}
</style>