<template>
    <div class="posr overflow-hidden" @touchstart="onTouchStart" @touchmove="onTouchMove">
		<slot></slot>
    </div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
        }
	},
	beforeMount() {
	},
    mounted() {
    },
	beforeDestroy() {
	},
	components: {
	},
    methods: {
		// 偵測 swipe 用
		onTouchStart(event) {
			let touch0 = event.targetTouches[0];
			this.startX = touch0.pageX;
			this.startY = touch0.pageY;
		},
		onTouchMove(event) {
			let touch0 = event.targetTouches[0];
			if (!this.startX || !this.startY) return;
			let diffX = touch0.pageX - this.startX;
			let diffY = touch0.pageY - this.startY;
			if (Math.abs(diffY) > 20) {
				delete this.startX;
			}
			if (diffX > 25) {
				this.$emit("swipe", "right");
				delete this.startX;
			} else if (diffX < -25) {
				this.$emit("swipe", "left");
				delete this.startX;
			}
		},		
	},
	watch: {
	},
    computed: {
    }
}
</script>

<style scoped>
</style>