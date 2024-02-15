<template>
	<ScrollBounce class="convert-market-price-ctn FULL font-size-small flex-col" v-stop-propagation-y>		
		<div class="memo mg5 pd3 flex-center">
			{{$ln('市价转换上方说明')}}
		</div>
		<ConvertMarketPriceItem class="mgb3" v-for="obj in pdsettingConvertMarketPrice" :key="`key-${obj.exgId}`" :config="obj" />
		<div class="h10vw"></div>
    </ScrollBounce>
</template>

<script>
import ConvertMarketPriceItem from "@/components/ConvertMarketPriceItem.vue"
export default {
	props: [],
	data() {
		return {}
	},
	beforeMount() {
		this.$emit('title', '市价转换设定');
	},
    mounted() {},
	beforeDestroy() {},
	components: {ConvertMarketPriceItem},
    methods: {
	},
	watch: {},
    computed: {
		pdsettingConvertMarketPrice() {
			try{return this.$store.state.config.quotePdSetting.function.convertMarketPrice;}catch(e){}
		},
	},
}
</script>

<style scoped>
.memo {
	color: #0BA0FF;
	border: 1px solid #333;
}
</style>