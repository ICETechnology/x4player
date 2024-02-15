<!-- 手勢鎖 http://ignitersworld.com/lab/patternLock.html#documentation -->
<template>
    <div class="flex-col">
		<MyHead class="head" :showText="$ln('设定登入手势')" :backType="1" :acc-btn="false"></MyHead>
		<div class="flex-1 flex-center flex-col" v-if="!success">
			<div class="font-size-big clr-orange m5">{{$ln("设定手势")}}</div>
			<div class="m5">{{$ln("请画出图形密码，6-14點可重複連線圖形")}}</div>
			<div class="m5">{{message}}</div>
			<div id="pattern-lock-ctn" class="posr" v-stop-propagation-touchmove></div>
			<div class="flex-center"></div>
		</div>
    	<div class="flex-col flex-1 flex-center" v-if="success">
			<div><i class="material-icons md-48">check_circle</i></div>
			<div class="font-size-big clr-orange m10">{{$ln("设定成功")}}</div>
			<div class="m10">{{$ln("已完成设定登入手势")}}</div>
			<br><br>
			<Button class="m10 w100" @click="onBtnReady">{{$ln("完成")}}</Button>
		</div>
    </div>
</template>

<script>
const message1 = `请设定登入用解锁手势`;
const message2 = `请再设定一次解锁手势`;

import PatternLock from 'patternlock';
import 'patternlock/dist/patternlock.css';

export default {
	props: [],
	data() {
		return {
			message: this.$ln(message1),
			pattern: null,
			/** 手势锁设定成功 */
			success: false,
        }
	},
	beforeMount() {
	},
    mounted() {
		this.lock = new PatternLock("#pattern-lock-ctn", {
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
					this.message = this.$ln(message2);
				}
				// 第二次設定
				else {
					// 設定正確
					if (pattern === this.pattern) {
						this.success = true;
						localStorage.setItem(`${this.$store.state.config.projectID}_PATTERN_LOCK`, pattern);
					}
					// 設定錯誤
					else {
						this.$store.state.notify(`error`, `设定错误，请重新设定`);
					}
					this.pattern = null;
					this.message = this.$ln(message1);
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
    }
}
</script>

<style scoped>
</style>