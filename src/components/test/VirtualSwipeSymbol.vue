<template>
    <swiper ref="vSwiper" :options="swiperOption" @slideChange="slideChange">
        <swiper-slide>
            <QuotePage :suspend="suspend"></QuotePage>
        </swiper-slide>
        <swiper-slide>Slide 2</swiper-slide>
        <swiper-slide>Slide 3</swiper-slide>
        <div class="swiper-pagination" slot="pagination"></div>
    </swiper>
</template>

<script>
import QuotePage from "./QuotePage.vue";
export default {
	data() {
		return {
			swiperOption: {
                direction: 'vertical',
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                },
                slideVisibleClass : 'my-slide-visible',
            },
        }
    },
    mounted() {
    },
    methods: {
		slideChange(){
		}
    },
    computed: {
		swiper() {
			return this.$refs.vSwiper.swiper;
		},
    },
	components: {
        QuotePage,
	},
}
</script>

<style>
</style>