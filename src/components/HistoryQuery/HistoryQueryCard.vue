<template>
    <div ref="ctn" class="history-query-card flex-row list-block-left bgc-head rd2 pdtb1"
		:class="{'opacity0': !visibility}" :style="{'min-height': styleHeight}" v-waypoint="{active: true, callback: onWaypoint}">
        <div v-if="visibility" class="column-ctn flex-col cnt-4" v-for="(obj,idx) in column">
            <div class="nowrap clr-gray2 font-size-nano">{{obj}}</div>
            <div class="font-size-nano">{{data[idx] || '--'}}</div>
        </div>
    </div>
</template>

<script>
export default {
	props: ['column', 'data', 'index', 'type'],
	data() {
		return {
            visibility: false,
        }
	},
	beforeMount() {},
    mounted() {
		// 利用第一張卡片來計算卡片高度
		// if (this.index === 0)
		// 	setTimeout(this.updateHeight, 500);
	},
	beforeDestroy() {},
	components: {},
    methods: {
		/** 滾動監聽 */
		onWaypoint({going, direction}) {
            this.visibility = going === 'in';
			
			if (this.index === 0 && !this.cardHeight) {
				setTimeout(this.updateHeight, 100);
			}
		},
		updateHeight() {
			let element =  this.$refs.ctn;
			let computedStyle = getComputedStyle(element);
			let elementHeight = element.clientHeight;  // height with padding
			elementHeight -= parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
			if (elementHeight > 20)
				this.$store.state.status.cardHeight[this.type] = elementHeight;
		},
    },
	watch: {},
    computed: {
		// 使用第一張卡片算出來的高度，同步到所有卡片 (為了讓卡片先佔高度，讓捲動順暢)
		styleHeight() {
			if (this.index === 0)
				return;
			if (this.cardHeight)
				return `${this.cardHeight}px`;
		},
		cardHeight() {
			return this.$store.state.status.cardHeight[this.type];
		},
    },
}
</script>

<style scoped>
.column-ctn.cnt-3 {
	width: 33%;
}
.column-ctn.cnt-4 {
	width: 25%;
}
.column-ctn.cnt-5 {
	width: 20%;
}
</style>