<template>
    <div class="ad-ctn flex-col">
		<div class="ad-block flex-col pd3" v-for="obj in cptADList">
			<!-- 圖片 -->
			<div class="posr" @click="onClick(obj)">
				<img class="w100p" v-if="obj.items" :src="obj.items[0].url_img" alt="" />
				<span class="detail-btn flex-center font-size-micro">{{$ln(`详情`)}}</span>
			</div>
			<!-- 標題 -->
			<div class="font-size-big mgtb2" v-html="obj.name" />
			<!-- 內文 -->
			<div class="font-size-micro clr-gray mgb3" v-html="obj.desc" />
		</div>
		<div class="bottom-div posr" v-waypoint="{active: true, callback: onWaypoint}">
			<LoadingIcon v-if="isLoading"></LoadingIcon>
		</div>
    </div>
</template>

<script>
/** 滾動監聽 */
import Vue from 'vue';
import VueWaypoint from 'vue-waypoint'
export default {
	props: [],
	data() {
		return {
			isLoading: true,
		}
	},
	beforeMount() {
		Vue.use(VueWaypoint);
		// vuex 廣告列表資料
		M4C.AD.queryADList();
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		/** 點擊廣告 */
		onClick(obj) {
			window.openLink(obj.items[0].url_link);
		},
		/** 標題內容為純文字時，預設給的 class 樣式 */
		headClass(str) {
			return /<\/?[a-z][\s\S]*>/i.test(str) ? '' : 'font-size-big mgt3';
		},
		/** 描述內容為純文字時，預設給的 class 樣式 */
		descClass(str) {
			return /<\/?[a-z][\s\S]*>/i.test(str) ? '' : 'font-size-micro clr-gray mgt3 mgb5';
		},
		/** 滾動監聽 */
		onWaypoint({going, direction}) {
			if (going==="in" && direction==="top") {
				if (this.existMore) {
					this.isLoading = true;
					M4C.AD.getMore();
				}
			}
		},
	},
	watch: {
		// 資料長度變化呼入
		cptADList(nv) {
			this.isLoading = false;
		},
		// 無更多資料時呼入
		existMore(nv) {
			this.isLoading = nv;
		},
	},
    computed: {
		orgADList() {
			return this.$store.state.data.adList;
		},
		cptADList() {
			// 略過第一個廣告 (第一個廣告放在 ADTop 裡)
			return this.orgADList.slice(1);
		},
		existMore() {
			return this.orgADList.existMore;
		},
	},
}
</script>

<style>
/* 一则广告的容器 */
.ad-ctn .ad-block {
	margin: 2.6vw 5.3vw;
	border-radius: 2vw;
	background-color: #182636;
}
/* 详情按钮 */
.ad-ctn .detail-btn {
	position: absolute;
	right: 2vw;
	bottom: 3vw;
	width: 61px;
	height: 33px;
	color: white;
	border-radius: 2vw;
	background-color: #F5A623;
}
/* 最底部负责呈现转圈圈的容器 */
.ad-ctn .bottom-div {
	min-height: 50px;
}
/* server 来的标题与内文拿不掉 <p> */
.ad-ctn p {
	margin: 0;
}
</style>