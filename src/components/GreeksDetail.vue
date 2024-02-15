<template>
    <div class="greeks-detail-ctn flex-row">
        <!-- 倉位類型 -->
        <div class="label-ctn flex-col">
            <span class="label flex-center pdb2 clr-gray2 font-size-mini">{{$ln('類別')}}</span>
            <span class=" flex-center clr-orange pdb2" v-if="ssps.$BQTY">{{$ln(BuyType)}}</span>
            <span class=" flex-center clr-orange pdb2" v-if="ssps.$SQTY">{{$ln(SellType)}}</span>
        </div>
        <!-- 持倉greeks資料 -->
        <div class="data-ctn flex-wrap flex-1">
            <div v-for="(obj, idx) in dataList" class="flex-col content" :key="idx">
                <span class="label flex-center pdb2 clr-gray2 font-size-mini">{{$ln(obj.label)}}</span>
                <span class="flex-center pdb2">{{getValue(obj.key)}}</span>
            </div>
        </div>
    </div>
</template>
<script>
import QuoteAgent from '@/components/QuoteAgent';
export default {
    mixins: [QuoteAgent],
    data() {
        return {
            // greeks欄位顯示設定
            dataList: [
                {label: "Delta",key: "DELTA"}, 
                {label: "Vega",key: "VEGA"}, 
                {label: "Theta",key: "THETA"}, 
                {label: "Rho",key: "1%RHO"}, 
                {label: "Gamma",key: "GAMMA"}, 
                {label: "时间价值",key: "TIME_VALUE"},
            ]
        }
    },
    props: [],
    methods: {
        // 取得持倉特定欄位資料
        getValue(key) {
            let value = this.ssps[key];
            if(value) return parseFloat(value).toFixed(2);
            else return '--'
        },
    },
    computed: {
        /** 當前選擇的商品代碼 */
        sid() {return this.$store.state.selectedSymbol.ID},
        /** 當前選擇的部位匯總 */
        ssps() {return this.$store.state.selectedSymbol.positionSum;},
        isOption() {return this.sid.split('.')[1] == 'O';},
        /** 依商品類型顯示多方倉位名稱 */
        BuyType() {
            if(this.ssps.$BQTY && this.isOption)
				return '权利仓';
            else if(this.ssps.$BQTY)
				return '多仓';
        },
        /** 依商品類型顯示空方倉位名稱 */
        SellType() {
            if(this.ssps.$SQTY && this.isOption)
				return '义务仓';
            else if(this.ssps.$SQTY)
				return '空仓';
        },
    },
}
</script>
<style scoped>
.label-ctn>span{
    line-height: 1.2;
}
.label, .content{
    min-width: 21vw;
    max-width: 21vw;
}
</style>