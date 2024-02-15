<template>
    <div class="offsetdpl-card-ctn flex-col" v-waypoint="{active: true, callback: onWaypoint}" >
        <div class="subject-ctn flex-col flex-start pdtb3 pdlr2 tcend" @click="onClick" v-if="visibility">
            <!-- 合約資料 -->
            <div class="contract-ctn w100p">{{`${$contract}`}}</div>
            <div class="total-data-ctn flex-row flex-1 w100p pdtb2">
                <!-- 同合約總買賣數量 -->
                <div class="totalqty-ctn flex-1 flex-row flex-center" v-html="sumBSQty()" />
                 <!-- 同合約總手續費 -->
                <div class="totalfee-ctn flex-1 flex-center">{{$totalFee.toString().commas()}}</div>
                 <!-- 同合約總交易稅 -->
                <div class="totaltax-ctn flex-1 flex-center">{{$totalTax.toString().commas()}}</div>
                 <!-- 同合約總淨損益 -->
                <div class="totalpl-ctn flex-1 flex-end" :class="$clr0($totalPurePL)">{{parsePL($totalPurePL)}}</div>
            </div>
        </div>
    </div>
</template>
<script>
export default {
    data() {
        return {
            visibility: false,
        }
    },
    props:['record', 'exchange'],
    mounted() {},
    methods: {
        // 依買賣方向取字色
        getClr(side) {
            if(side == 'BUY') return 'clr-up';
            else if(side == 'SELL') return 'clr-dn';
        },
        // 取買賣方向
        parseSide(side) {
            return side[0];
        },
        // 取日期資料並轉換顯示格式
        parseDate(date) {
            if(!date) return "--/--/--";
            let _date = date.split('-');
            _date[0] = _date[0].substr(2);
            return _date.join('/');
        },
        // 取損益資料
        parsePL(value) {
            if(isNaN(value)) return value;
            if(value >= 0) value = `+${value}`;
            let priceArr = value.toString().split('.');
            // 取到小數第一位
            let _pl = `${priceArr[0]}.${priceArr[1]?priceArr[1][0]||'':0}`;
            return _pl.commas();
        },
        sumBSQty() {
            let bEl = `<div class="clr-up mgr1">${this.sumBQty}</div>`;
            let sEl = `<div class="clr-dn mgl1">${this.sumSQty}</div>`;
            return `${bEl} / ${sEl}`;
        },
        /** 滾動監聽 */
		onWaypoint({going, direction}) {
			// console.log(`QuoteCard.onWaypoint`, this.sid, going, direction);
			this.visibility = going === "in";
		},
        onClick() {
            this.$emit('cardClick', this.record);
        },
        // 取每筆淨損益
        getPurePL(rec){
			let totalFee = Number(rec.OPEN_FEE) + Number(rec.OFFSET_FEE);
			let totalTax = Number(rec.OPEN_TAX) + Number(rec.OFFSET_TAX);
			let pl = Number(rec.REALIZED_DAILY_PL);
			return this.$safeFloat(pl - totalFee - totalTax);
		},
    },
    watch: {},
    computed: {
        // 合約名稱
        $contract() {return M4C.Symbol.getCNM4(this.record[0].SYMBOL, " ");},
        // 加總淨損益資料
        $totalPurePL() {
            let sum = 0;
            this.record.forEach(rec => {
                sum += this.getPurePL(rec);
            });
            return sum;
        },
        // 加總手續費
        $totalFee() {
            let sum = 0;
            this.record.forEach(rec => {
                sum += this.$safeFloat(Number(rec.OPEN_FEE) + Number(rec.OFFSET_FEE));
            });
            return sum;
        },
        // 加總交易稅
        $totalTax() {
            let sum = 0;
            this.record.forEach(rec => {
                sum += this.$safeFloat(Number(rec.OPEN_TAX) + Number(rec.OFFSET_TAX));
            });
            return sum;
        },
        // 買方數量
        sumBQty() {
            let sum = 0;
            this.record.forEach(rec => {
                if(rec.OPEN_SIDE == "B")
                    sum += Number(rec.OPEN_QTY);
                else
                    sum += Number(rec.OFFSET_QTY);
            });
            return sum;
        },
        // 賣方數量
        sumSQty() {
             let sum = 0;
            this.record.forEach(rec => {
                if(rec.OPEN_SIDE == "S")
                    sum += Number(rec.OPEN_QTY);
                else
                    sum += Number(rec.OFFSET_QTY);
            });
            return sum;
        },
        // 與0比取字色class
        $clr0() {return this.$store.state.fn.$clr0;},
        $symbolPrice() {return this.$store.state.fn.$symbolPrice;},
    },
}
</script>
<style scoped>
.offsetdpl-card-ctn {
    min-height: 12vw;
}
.subject-ctn {
    height: 12vw;
}
.opend-reocrd-ctn>span, .offset-reocrd-ctn>span {
    min-width: 20%;
    max-width: 20%;
}
.record-ctn:nth-child(even) {
    background-color: #111820;
}
</style>