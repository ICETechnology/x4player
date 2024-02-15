<template>
    <div class="font-size-adjust-btn flex-center">
        <i class="icon material-icons md-24 tcef" @click="onSub">remove</i>
        <span class="flex-center pd1 mglr2 rd1 border-gray font-text-ctn" :key="currentFontSize">
            <i class="icon material-icons mgr0d5">font_download</i>
            {{currentFontSizeText}}
        </span>
        <i class="icon material-icons md-24 tcef" @click="onAdd">add</i>
    </div>
</template>
<script>
export default {
    data(){
        return {
            fontSizeList:[],
            //特大 / 大 / 中 / 小 / 特小
            sizeTextMap: {
                large: '特大',
                big: '大',
                normal: '中',
                little: '小',
                small: '特小',
            },
        }
    },
    mounted() {
        this.fontSizeList = Object.keys(this.sizeTextMap);
    },
    methods: {
        onAdd() {
            let idx = this.fontSizeList.indexOf(this.currentFontSize);
            if(idx == 0) return;
            else idx --;
            this.$store.state.config.articleContentFontSize = this.fontSizeList[idx];
        },
        onSub() {
            let idx = this.fontSizeList.indexOf(this.currentFontSize);
            if(idx == this.fontSizeList.length - 1) return;
            else idx ++;
            this.$store.state.config.articleContentFontSize = this.fontSizeList[idx];
        },
    },
    computed: {
        currentFontSize() {return this.$store.state.config.articleContentFontSize;},
        currentFontSizeText() {return this.sizeTextMap[this.currentFontSize];},
    }
}
</script>
<style scoped>
.font-text-ctn {
    width: 4em;
}
</style>