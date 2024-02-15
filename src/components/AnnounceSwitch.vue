<template>
    <div class="opts-switch-ctn flex-row" :class="{disabled: !optList || !indexList.length}">
        <div class="flex-1 pre-opt flex-start clr-gray tcef" @click="onPreOpt" :class="{'disabled opacity0':!preOpt}">
            <i class= "material-icons">arrow_left</i>
            {{convertLabelName(preOpt)}}
        </div>
        <div class="flex-1 flex-center clr-orange font-size-normal current-label" v-if="optList && indexList.length">{{convertLabelName(curOpt)}}</div>
        <div class="flex-1 flex-center font-size-normal" v-if="!optList || !indexList.length">{{$ln('无资料')}}</div>
        <div class="flex-1 next-opt flex-end clr-gray tcef" @click="onNextOpt" :class="{'disabled opacity0':!nextOpt}">
            {{convertLabelName(nextOpt)}}
            <i class= "material-icons">arrow_right</i>
        </div>
    </div>    
</template>
<script>
export default {
    data() {
        return {
			indexList: [],
		}
    },
    props: ["optList", "value"],
	beforeMount() {
		this.indexList = Object.keys(this.optList);
	},
	mounted() {
		if(this.value === "")
			this.$emit('input', this.curOpt);
	},
    methods: {
        // 切換上一檔商品
        onPreOpt() {
            if(this.value)
                this.$emit('input', this.preOpt);
        },
        // 切換下一檔商品
        onNextOpt() {
            if(this.value)
                this.$emit('input', this.nextOpt);
        },
        // 轉換
        convertLabelName(label) {
			if(!label) return;
            return `${label.substr(0, 4)}${'年'} ${label.substr(4)}${'月'}`;
        },
    },
    watch: {
        optList(nv, ov) {
            this.indexList = Object.keys(this.optList);
        }
    },
    computed: {
        // 前一個
        preOpt() {
            // 依當前位置找上一個位置
            let idx = this.currentOptIdx - 1;
            return this.indexList[idx];
        },
        curOpt() {
            return this.indexList[this.currentOptIdx];
        },
        // 下一個
        nextOpt() {
            // 依當前位置找下一個位置
            let idx = this.currentOptIdx + 1;
            return this.indexList[idx];
        },
        // 當前位置
        currentOptIdx() {
            // 以v-model方式尋找位置。
			let idx = this.indexList.indexOf(this.value);
			return idx >= 0? idx: this.indexList.length - 1;
        },
    },
}
</script>
<style scoped>
.pre-opt,.next-opt {
    min-width: 5em;
}
.current-label {
	line-height: 2;
}
</style>