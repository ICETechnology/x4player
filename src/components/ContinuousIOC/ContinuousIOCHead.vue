<template>
	<div class="continuous-ioc-head flex-col flex-start" >
		<div class="flex-row w100p h50 flex-center">
			<!-- 返回按鈕 -->
			<i class="material-icons md-30 mglr3 tcef" @click="onBtnBack">keyboard_arrow_left</i>
			<span class="">{{$ln('連續IOC')}}</span>
			<div class="flex-1" />
		</div>		
	</div>
</template>

<script>
export default {
	data() {
		return {
		}
	},
	mounted() {},
	methods: {
        onBtnBack() {
			eventBus.$emit("CLOSE-DIALOG");
		},
    },
	computed: {

	},
}
</script>

<style lang='scss' scoped>
.continuous-ioc-head {
	background-color: #F58923;
}

</style>