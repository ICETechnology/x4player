<!-- 手勢鎖 http://ignitersworld.com/lab/patternLock.html#documentation -->
<template>
	<div class="pattern-unlock flex-col" :class="{'bg-white': this.bgWhite = true}">
		<div v-html="step1Html" />
		<div id="pattern-lock-ctn" class="posr" v-stop-propagation-touchmove></div>
	</div>
</template>

<script>
import PatternLock from 'patternlock';
import 'patternlock/dist/patternlock.css';

export default {
	props: ['bgWhite'],
	data() {
		return {
		}
	},
	beforeMount() {
	},
	mounted() {
		// 登入手勢鎖
		let storagePattern;
		if(this.$store.state.securityLogin.type == 'pattern') {
			storagePattern = this.$store.state.securityLogin.value
		}		
		this.lock = new PatternLock("#pattern-lock-ctn", {
			allowRepeat : true,
			radius:20,margin:20,
			onDraw: function(pattern){
				if (pattern.length < 6 || pattern.length > 14) {
					this.$store.state.notify(`请画出图形密码，6-14點可重複連線圖形`);
					this.lock.reset();
					return;
				}
				if (pattern == storagePattern) {
					this.$emit('pattern-unlock');
				}
				else {
					eventBus.$emit("CONFIRM-DIALOG", {
						content: this.$ln("手勢錯誤，請再試一次"),
						confirmOnly: true,
					});
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
	},
	watch: {
	},
	computed: {
		step1Html() {
			try {return this.$store.state.config.publicPdSetting.function.patternLock.step1Html;}catch(e){}
		},
	}
}
</script>

<style>
.pattern-unlock {
	background-color: #111820;
	position: relative;
	z-index: 1;
}
#pattern-lock-ctn {
	margin-top: -30px;
}
.bg-white {
	background-color: transparent;
}

.bg-white .patt-dots{
	background-color: #0094BC;
}

.bg-white .patt-lines{
	background: #2fca9175;
}
</style>