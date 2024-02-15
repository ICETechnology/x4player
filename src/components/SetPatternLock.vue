<!-- 手勢鎖 http://ignitersworld.com/lab/patternLock.html#documentation -->
<template>
	<div class="flex-col">
		<div class="flex-1 flex-center flex-col">
			<div v-html="!pattern ? step1Html : step2Html" />
			<div id="pattern-lock-ctn" class="posr" v-stop-propagation-touchmove></div>
			<div class="flex-center"></div>
		</div>
	</div>
</template>

<script>
import PatternLock from 'patternlock';
import 'patternlock/dist/patternlock.css';
import SetPatternLockSuccess from "@/components/SetPatternLockSuccess.vue";

export default {
	props: [],
	data() {
		return {
			pattern: null,
		}
	},
	beforeMount() {
		this.$emit('title', '手勢登入');
	},
	mounted() {
		this.lock = new PatternLock("#pattern-lock-ctn", {
			allowRepeat : true,
			onDraw: function(pattern){
				console.log(`pattern`, pattern);
				if (pattern.length < 6 || pattern.length > 14) {
					this.$store.state.notify(`请画出图形密码，6-14點可重複連線圖形`);
					this.lock.reset();
					return;
				}
				// 第一次設定
				if (!this.pattern) {
					this.pattern = pattern;
				}
				// 第二次設定
				else {
					// 設定正確
					if (pattern === this.pattern) {
						this.$store.state.securityLogin = {type: 'pattern', value: pattern};
						eventBus.$emit("CLOSE-DIALOG");
						setTimeout(()=>{
							eventBus.$emit("POPUP-DIALOG", SetPatternLockSuccess, "", {transName: 'float'});
						},100);
					}
					// 設定錯誤
					else {
						this.$store.state.notify(`error`, `设定错误，请重新设定`);
					}
					this.pattern = null;
				}
				this.lock.reset();
			}.bind(this)
		});
	},
	beforeDestroy() {
	},
	components: {
	},
	methods: {
		onBtnReady() {
			eventBus.$emit("CLOSE-DIALOG");
		}
	},
	watch: {
	},
	computed: {
		step1Html() {
			try {return this.$store.state.config.publicPdSetting.function.patternLock.step1Html;}catch(e){}
		},
		step2Html() {
			try {return this.$store.state.config.publicPdSetting.function.patternLock.step2Html;}catch(e){}
		},
	}
}
</script>

<style scoped>
</style>