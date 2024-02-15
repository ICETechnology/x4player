<template>
	<div class="swiper-container swiper-container-main-page" v-show="!$store.state.desktop.dragCom">
		<div class="swiper-wrapper">
			<div class="swiper-slide ad-top-ctn posr flex-center" v-for="(obj, idx) in firstAD.items" @click="onClick(obj)">
				<img class="" :src="obj.url_img" alt="" :style="{width: slideWidth+'px'}"/>
			</div>
		</div>
		<!-- Add Pagination -->
		<div class="swiper-pagination"></div>		
	</div>
</template>

<script>
import Swiper from 'swiper';
import '@/css/swiper.4.5.0.min.css'
export default {
	props: [],
	data() {
		return {
			isLoading: true,
			displayIdx: 0,
			slideWidth: 0,	// 廣告圖片預設寬度
		}
	},
	beforeMount() {
	},
    mounted() {
		// 查詢廣告列表
		M4C.AD.queryADList();
		// 500ms 後建立 swiper 
		setTimeout(()=>{
			this.mySwiper = new Swiper(`.swiper-container-main-page`, {pagination: {el: '.swiper-pagination'}});
			// 重設廣告圖片寬度。
			this.slideWidth = this.mySwiper.width;
		}, 500);
		// 自動輪播
		this.interval = setInterval(()=>{
			// Swiper當前頁面的索引值
			let currentIdx = this.mySwiper.activeIndex;
			this.displayIdx = ++currentIdx % this.imgCnt;
			this.mySwiper.slideTo(this.displayIdx);
		}, 10000);
	},
	beforeDestroy() {
		// 停止輪播及消滅swiper
		if(this.interval)
			clearInterval(this.interval);
		if(this.mySwiper)
			this.mySwiper.destroy();
	},
	components: {},
    methods: {
		/** 點擊廣告 */
		onClick(obj) {
			window.openLink(obj.url_link);
		},
	},
	watch: {},
    computed: {
		imgCnt() {
			try{return this.adList[0].items.length;}catch(e){}
		},
		adList() {
			return this.$store.state.data.adList;
		},
		firstAD() {
			return this.adList[0] || {};
		},
		isDesktop() {
			return this.$store.state.device.isDesktop;
		},
	},
}
</script>

<style>
.swiper-pagination .swiper-pagination-bullet {
	width: 6px;
	height: 6px;
    border: 1px solid white;
	opacity: .5;
	background-color: gray;	
}
.swiper-pagination .swiper-pagination-bullet-active {
	width: 20px;
    height: 5px;
	margin-top: -1px !important;
    border-radius: 2.5px;
	opacity: 1;
    border: 1px solid #FAC491;	
    background-color: #F58923;
}
.ad-top-ctn {
	height: 230px;
	overflow: hidden;
}
.ad-top-ctn img {
	height: 230px;
	object-fit: cover;
}

/** 桌機版 */
.desktop .swiper-container {
	position: absolute;
}
.desktop .ad-top-ctn {
	width: 100%;
	height: 100%;
    max-width: 100%;
    max-height: 100%;
}
.desktop .ad-top-ctn img {
	width: 100%;
	height: 100%;
    max-width: 100%;
    max-height: 100%;
}
</style>