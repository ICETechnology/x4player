<template>
	<div class="FULL w100p swiper-container helper-swiper-container-main-page">
		<div class="swiper-wrapper">
			<div class="swiper-slide posr" v-for="obj in helperList">
				<div class="FULL flex-col mglr3">
					<div class="flex-1 img-ctn mgb5" :style="`background-image: url('${obj.url}')`"></div>
					<div class="flex-center mgb5 font-size-big font-bold">{{obj.desc}}</div>
				</div>
			</div>
		</div>
		<div class="swiper-pagination"></div>
	</div>
</template>

<script>
import Swiper from 'swiper';
import '@/css/swiper.4.5.0.min.css'

export default {
	props: ['helperList'],
	data() {
		return {}
	},
	beforeMount() {},
    mounted() {
		let self = this;
		// 延遲等 vue 把 element 建立完成
		setTimeout(()=>{
			self.mySwiper = new Swiper(`.helper-swiper-container-main-page`, {
				pagination: {
					el: '.swiper-pagination',
				},
			});
		}, 200);
	},
	beforeDestroy() {
		if (this.mySwiper)
			this.mySwiper.destroy(false);
	},
	components: {},
    methods: {},
	watch: {},
    computed: {},
}
</script>

<style scoped>
.swiper-wrapper {
	height: 97%;
}
.img-ctn {
	border-radius: 2vw;
	background: no-repeat center;
	background-size: cover;	
}
</style>