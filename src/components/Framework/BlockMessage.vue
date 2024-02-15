<template>
	<div class="loading-message-ctn FULL">
		<div class="FULL loading-mask"/>
		<div class="loading-ctn flex-col">
			<div class="flex-1 head flex-center pdt2 clr-gray">{{$ln(param.head)}}</div>
			<div class="flex-1 body flex-center flex-col pdt3 pdb5 pdlr3">
				<div class="loading-icon-ctn posr mgb2" v-if="param.showLoadingIcon"><LoadingIcon/></div>
				<div class="flex-center break-all" v-html="$ln(param.body)"></div>
			</div>
			<div v-if="param.showConfirmBtn || param.showCancelBtn" class="flex-1 foot" :class="btnStyle">
				<div v-if="param.showConfirmBtn" class="flex-1 flex-center pdtb2 tcef" @click="onBtnConfirm">{{$ln(param.confirmText || '确认')}}</div>
				<div class="split-line" v-if="showSplitLine" />
				<div v-if="param.showCancelBtn" class="flex-1 flex-center pdtb2 tcef" @click="onBtnCancel">{{$ln(param.cancelText || '取消')}}</div>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	props: ['param', 'clickConfirm'],
	data() {
		return {
		}
	},
	beforeMount() {},
	mounted() {},
	beforeDestroy() {},
	components: {},
	methods: {
		onBtnConfirm() {
			this.param.display = false;
			// 如果有設定參數時，回傳參數。
			this.$emit('confirm', this.param.conFirmData || "");
		},
		onBtnCancel() {
			this.param.display = false;
			this.$emit('cancel');
		},
	},
	watch: {
		// 是否直接按下確認
		clickConfirm() {
			if(this.clickConfirm)
				this.onBtnConfirm();
		}
	},
	computed: {
		// 確認取消是否同時顯示
		showSplitLine() {return this.param.showConfirmBtn && this.param.showCancelBtn;},
		btnStyle() {
			// 以showSplitLine来判斷排列方式
			if(this.showSplitLine) return 'flex-row';
			else return 'flex-col';
		},
	},
}
</script>

<style scoped>
.loading-mask {
	z-index: 999;
	opacity: 0.3;
	background-color: black;
}
.loading-ctn {
	z-index: 999;
	position: absolute;
	top: 30%;
	left: 20vw;
	right: 20vw;
	/* width: 60vw; */
	border-radius: 1vw;
	color: white;
	background-color: rgb(52,72,94);
}
.loading-icon-ctn {
	height: 30px;
}
.foot {
	border-top: 1px solid #4E6C8D;
}
.split-line{
	border-left: 1px solid #4E6C8D;
}
</style>