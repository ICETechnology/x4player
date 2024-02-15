<template>
    <div class="bgc-IOC-card rd3 posr pdb1 mgtb4" @click="goIOCHistory" >
        <!-- 上半部 -->
        <div class="pdlr5 pdt1">
            <div class="flex-row pdb2">
                <div class="font-size-big font-bold" v-if="contiioc.USER_DATA" >{{ $ln(symbolLabel)}}</div>
                <div class="flex-1"></div>
                <div class="font-bold flex-end mgr5">對手價</div>
            </div>
            <div class="flex-row flex-start pdb1 font-size-normal font-bold">
                <div class="pdr2" :class="[clrSide(contiioc.SIDE)]" >{{ sideText(contiioc.SIDE) }}</div>
                <div class="pdr2">{{getOptionMonth(contiioc.SYMBOL)}}</div>
                <div class="pdr2" :class="[clrCallPut(contiioc.SYMBOL)]" >{{ getCallPut(contiioc.SYMBOL) }}</div>
                <div class="pdr2">{{ getStrike(contiioc.SYMBOL) }}</div>
            </div>
            <div class="flex-row flex-start pdb1 font-size-normal font-bold">
                <div class="pdr2" :class="[clrSide(contiioc.SIDE2)]">{{ sideText(contiioc.SIDE2) }}</div>
                <div class="pdr2">{{getOptionMonth(contiioc.SYMBOL2)}}</div>
                <div class="pdr2" :class="[clrCallPut(contiioc.SYMBOL2)]">{{ getCallPut(contiioc.SYMBOL2) }}</div>
                <div class="pdr2">{{ getStrike(contiioc.SYMBOL2) }}</div>
            </div>
        </div>				
        <!--下半部  -->
        <div class="contiioc-footer font-size-small pdtb1 pdlr5" :class="[getStatusClass(contiioc.STATUS)]" >
            <div class="flex-row font-bold">
                <div class="flex-2">
                    <div class="clr-e8a">倉別</div>
                    <div class="pdtb1">{{ contiioc.TIME_IN_FORCE }} / {{ $ln(getPositionEffect(contiioc.POSITION_EFFECT))}}</div>
                </div>
                <div class="flex-1">
                    <div class="clr-e8a flex-center">總口數</div>
                    <div class="pdtb1 flex-center">{{ contiioc.QTY }}  </div>
                </div>
                <div class="flex-2">
                    <div class="clr-e8a flex-center">成交 / 委託</div>
                    <div class="pdtb1 flex-center">{{ contiioc.CUM_QTY }} / {{ contiioc.QTY }} </div>
                </div>
                <div class="flex-2"></div>
            </div>
            <div class="flex-row font-size-mini pdtb1 flex-vertical-center ">
                <div class="font-bold rd1 bgc-ioc-label pdtb1 pdlr3">{{statusLabelText(contiioc.STATUS)}}</div>
                <div v-if="contiioc.STATUS !=='ACTIVE'" class="flex-center mgl3"><i class="contiioc-icon material-icons tcef font-size-normal rd6 pd1" @click.stop="changeStatus('active')" >play_arrow</i></div>
                <div class="flex-center mgl3" @click.stop ><i class="contiioc-icon material-icons tcef font-size-normal rd6 pd1" :class="{'disabled':contiioc.STATUS !== 'ACTIVE'}" @click.stop="changeStatus('pause')" >pause</i></div>
                <div class="flex-center mgl3" @click.stop><i class="contiioc-icon material-icons tcef font-size-normal rd6 pd1" :class="{'disabled':contiioc.STATUS === 'STOP'}" @click.stop="changeStatus('stop')">stop</i></div>
                <div v-if="contiioc.STATUS ==='STOP'" class="flex-center mgl5" @click.stop><i class="clr-e8a material-icons md-24 tcef" @click.stop="onBtnPlotOrder">edit_square</i></div>
            </div>
        </div>
        <!-- 右邊區塊 -->
        <div class="contiioc-rigth pdtb3 rd2">
            <div class="font-size-large font-bold flex-center">{{followPrice}}</div>
            <div class="clr-c font-size-micro mgt3 mgb0d5 flex-center">觸發條件</div>
            <div class="flex-center font-size-large text-align-center" >{{ contiioc.CONDITION }}  {{contiioc.TRIGGER_PRICE}}</div>
            <div class="flex-center font-size-micro font-bold mgt1" >({{ contiioc.CURRENT_ROUND }}/{{ contiioc.MAX_ROUND }})</div>
        </div>
        <!-- 關閉按鈕 -->            
        <i class="flex-center mgt2 mgr2 font-size-normal material-icons rd1 tcef close-icon" @click.stop="onDeletebtn">close</i>
    </div>

</template>

<script>
import ContinuousIOCHead from '@/components/ContinuousIOC/ContinuousIOCHead.vue';
import PlotOrderTW from "@/components/PlotOrderTW/PlotOrderTW.vue";
import ContinuousIOCHistory from '@/components/ContinuousIOC/ContinuousIOCHistory.vue';

export default {
    props:['contiioc'],
	data() {
		return {
            qo: M4C.Quote.getQuoteObject(this.contiioc.SYMBOL),
            qo2: M4C.Quote.getQuoteObject(this.contiioc.SYMBOL2)
        }
	},
	beforeMount() {
        if (this.contiioc.SYMBOL) {
			M4C.Quote.sub(this.contiioc.SYMBOL, this);
			this.qo = M4C.Quote.getQuoteObject(this.contiioc.SYMBOL);
		}
        if (this.contiioc.SYMBOL2) {
			M4C.Quote.sub(this.contiioc.SYMBOL2, this);
			this.qo2 = M4C.Quote.getQuoteObject(this.contiioc.SYMBOL2);
		}
    },
    mounted() {},
    beforeDestroy() {
		// 解訂商品
		M4C.Quote.unsub(this.contiioc.SYMBOL, this);
        M4C.Quote.unsub(this.contiioc.SYMBOL2, this);
	},
	components: {ContinuousIOCHead,PlotOrderTW},
    methods: {
        getStatusClass(status){
            switch(status){
                case 'ACTIVE': return 'ioc-work';
                case 'PAUSE': return 'ioc-pause';
                case 'STOP': return 'ioc-stop';
            }
        },
        clrSide(side){
			if(side === "BUY")
				return "clr-up";
			else
				return "clr-dn";
		},
        sideText(side){
			if(side === "BUY")
				return "買";
			else
				return "賣";
		},
        getCallPut(sid){
            return M4C.Option.getCallPut(sid);
        },
        clrCallPut(sid){
            const CullPut = this.getCallPut(sid);
            if(CullPut ==='P') return 'clr-p';
            return 'clr-c';
        },
        getStrike(sid){
            return M4C.Option.getStrike(sid);
        },
        getPositionEffect(str) {
			switch(str) {
				case 'AUTO': return "自动";
				case 'OPEN': return "新仓";
				case 'CLOSE': return "平仓";
			}
		},
        statusLabelText(status){
            switch(status){
                case 'ACTIVE': return '洗價中...';
                case 'PAUSE': return '暫停';
                case 'STOP': return '停止';
            }
        },
        /** 彈出策略下單盒 */
		onBtnPlotOrder() {      
            const selectedSymbol = this.contiioc.SYMBOL.split('.').slice(0,4).join('.')
			// 解決 [T字週台選]進入[策略下單盒]時 opt.selectedSymbol 會被切換為 I.O.TWF.TX1 導致返回T字報價的商品跳回第一項 https://trello.com/c/ma2naepG
			const TWFarr = ['I.O.TWF.TX1', 'I.O.TWF.TX2', 'I.O.TWF.TX3', "I.O.TWF.TX4", "I.O.TWF.TX5"];
			const symbol = TWFarr.includes(selectedSymbol)? "I.O.TWF.TXO" : selectedSymbol;

            const symbolObj = M4C.Option.getSymbolObj(symbol);

            let osid = this.$store.state.opt.selectedSymbol = M4C.Option.getOptPureSymbol(symbolObj);
			let info = this.$store.state.opt.underlyingSInfo = M4C.Symbol.getMainformInfo(osid);
			let usid = this.$store.state.opt.underlyingS = info.Underlying.S;
			this.$store.state.opt.underlyingSQO = M4C.Quote.getQuoteObject(usid);

            this.$store.state.plOrder.selectedStrategy.key = this.strategy.key
            setTimeout(()=>{
                const obj = {
                    checkIOC: true, //勾選連續IOC
                    editIOC: true, //編輯連續IOC
                    item: this.contiioc,
                    selectedMonth: this.month1,
                    selectedMonth2: this.month2,
                    contracts: this.$store.state.opt.contracts[this.month1],
                    strike1: this.strike1,
                    strike2: this.strike2,
                    from: "ContiIOC"
                };
                eventBus.$emit("POPUP-DIALOG", PlotOrderTW, obj);
                // eventBus.$emit("CLOSE-DIALOG-AFTER", PlotOrderTW, obj);
            },0)            
		},
        goIOCHistory(){
			eventBus.$emit("POPUP-DIALOG", ContinuousIOCHistory, this.contiioc, {'$HEAD': {'title': this.$ln(this.contiioc.USER_DATA.LABEL)},transName: 'float'});
        },
        onDeletebtn(){
            eventBus.$emit("CONFIRM-DIALOG", {
				title: this.$ln("移除條件"),
				content: this.$ln(`確定刪除 ${this.contiioc.USER_DATA.LABEL} 的條件?`),
				confirm: () => {					
                    M4C.ContinuousIOC.deleteContiIOC(this.contiioc);
				}
			});
        },
        changeStatus(status){
            const contiioc = this.contiioc;
            contiioc.AP_PLUGIN =  this.useComName || this.selfComName;
            contiioc.AP_TOOL = 'x4App';

            let text = "";
            switch(status) {
				case 'active': 
                    text = "開始";                    
                    break;
				case 'pause':
                    text = "暫停";
                    break;
				case 'stop':
                    text = "停止";
                    break;
			}
            eventBus.$emit("CONFIRM-DIALOG", {
                title: `${text}洗價`,
                content: `確認是否${text}洗價？`,
                confirm: () => {
                    M4C.ContinuousIOC.changeContiIOCStatus(contiioc,status);
                },
			});
        },        
        getOptionMonth(sid){
            return M4C.ContinuousIOC.getOptionMonth(sid);
        },
    },
	watch: {
        'contiioc.SYMBOL'(nv,ov){
            M4C.Quote.unsub( M4C.Symbol.toMonthSymbol(ov), this);
			M4C.Quote.sub( M4C.Symbol.toMonthSymbol(nv), this);
            this.qo = M4C.Quote.getQuoteObject(nv);
        },
        'contiioc.SYMBOL2'(nv,ov){
            M4C.Quote.unsub( M4C.Symbol.toMonthSymbol(ov), this);
			M4C.Quote.sub( M4C.Symbol.toMonthSymbol(nv), this);
            this.qo2 = M4C.Quote.getQuoteObject(nv);
        },
    },
    computed: {    
        // 當前組件名稱
		selfComName() {return M4C.Analysis.getComponentClassName(this);},
        symbolName() {
			return M4C.Symbol.getContractName(this.contiioc.SYMBOL);
		},
        symbolLabel() {
            return `${this.symbolName} - ${this.$ln(this.strategy.label)}`;
        },
        followPrice(){
            return M4C.ContinuousIOC.followPrice(this.oppositePrice1,this.oppositePrice2,this.strategy,this.contiioc.SYMBOL,this.contiioc.SYMBOL2);
        },
        strategy(){
            const m1 = this.month1;    
            const m2 = this.month2; 
            const cp1 = M4C.Option.getCallPut(this.contiioc.SYMBOL);
            const cp2 = M4C.Option.getCallPut(this.contiioc.SYMBOL2);            
            const strike1 = this.strike1;
            const strike2 = this.strike2;
            return M4C.Option.strategy(m1, m2, this.contiioc.SIDE, this.contiioc.SIDE2, cp1, cp2, strike1 ,strike2);
        },
        strike1(){
            return this.getStrike(this.contiioc.SYMBOL);
        },
        strike2(){
            return this.getStrike(this.contiioc.SYMBOL2);
        },
        month1(){
            return this.getOptionMonth(this.contiioc.SYMBOL);
        },
        month2(){
            return this.getOptionMonth(this.contiioc.SYMBOL2);
        },
        oppositePrice1(){     
            return this.contiioc.SIDE === "BUY" ? this.qo.sp1 : this.qo.bp1;
        },
        oppositePrice2(){
            return this.contiioc.SIDE2 === "BUY" ? this.qo2.sp1 : this.qo2.bp1;
        },

    },
}
</script>

<style scoped>

.bgc-IOC-card{
	background-color: #292c2e;
}
.clr-c{
	color: #E8A420 !important;
}
.clr-p{
	color:  #4a7fd5;
}
.clr-e8a{
    color: #E8A420
}
.ioc-work {background-color: #2c5632;}
.ioc-work .bgc-ioc-label{background-color: #56ae55;}
.ioc-work .contiioc-icon{
	background-color: white;
	color: #2c5632;
}
.ioc-pause{background-color: #283343;}
.ioc-pause .bgc-ioc-label{background-color: #e68e3e}
.ioc-pause .contiioc-icon{
	background-color: white;
	color: #283343;
}
.ioc-pause .material-icons.disabled{
    color: #283343 !important;
    background-color:#272727 !important;
}
.ioc-stop{background-color:#3b3b3b;}
.ioc-stop .bgc-ioc-label {background-color:#2A2A2A;}
.ioc-stop .contiioc-icon{
	background-color: white;
	color: #2A2A2A;
}
.ioc-stop .material-icons.disabled{
    color: #3b3b3b !important;
    background-color:#272727 !important;
    opacity: 1 !important;
}

.contiioc-footer{
	border-bottom-left-radius: 3vw;
	border-bottom-right-radius: 3vw;
}
.contiioc-rigth{
	position: absolute;
	top: 20%;
	right: 2vw;
	background-color: #12171f;
    width: 28vw;
}
.close-icon{
    position: absolute;
    top:0;
    right: 0;
    background-color: white;
    color: #292c2e;
    line-height: inherit;
}
.bgc-ioc-lightUp{
    background-color: #F58923;
}
</style>