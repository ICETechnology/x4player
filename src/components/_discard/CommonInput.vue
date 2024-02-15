<template>
	<div class="common-label flex-row flex-1" :for="cid" >
		<div class="label-text" v-if="$slots.default">
			<slot></slot>
		</div>
		<div class="input-block flex-1 flex-item" :class="$slots.default?'':'radius'">
			<span v-if="operatorBtn" class="btn" @click.stop="subVal"><i class="material-icons md-24">remove</i></span>
			<input type='text' readonly @click="openM4K" :id="cid" class="text-align-center flex-1 common-input ipt" v-model="value"/>
			<span v-if="operatorBtn" class="btn" @click.stop="addVal"><i class="material-icons md-24">add</i></span>
		</div>
	</div>
</template>
<<script>
import QuoteAgent from '@/components/QuoteAgent';

export default {
	mixins: [QuoteAgent],
	data(){
		return {
			cid: 'ipt'+this._uid,
			value: '',
			flag: '',
			ntsi: 5,
			sp: '',
			bp: '',
			operatorBtn: this.btn || false,
			tsi: 0
		}
	},
	props:['sid', 'm4kType', 'defaultValue', 'btn', 'suspend'],
	mounted() {
		eventBus.$on("SET-M4K-VALUE-"+this.cid, (param)=>{
			this.value = param.v;
			this.flag = param.f;
		});	
		if(this.sid){
			this.tsi = M4C.Symbol.getTickSize(this.sid, this.qo.p);
		}
		this.value = this.defaultValue;
	},
	watch:{
		sid: function (newv) {
			this.flag = '';
		},
		value: function(newv){
			if(!this.flag && this.sid){
				eventBus.$emit("PRICE-CHANGE", this.value);
				this.bp = this.value;
				this.sp = this.value;				
			}
		},
		flag: function (newv,oldv) {
			eventBus.$emit("FLAG-PRICE-CHANGE", this.flag);
			this.getFlagPrice(newv);
		},
		qo: {
			handler:function (newv) {
				if(this.flag)
				this.getFlagPrice(this.flag);
			},
			deep:true
		},
		sp: function (newv) {
			this.$emit('sp-change',newv);
		},
		bp: function (newv) {
			this.$emit('bp-change',newv);
		},
		defaultValue: function(nv, ov) {
			this.value = nv;
		}
	},
	methods: {
		addVal(){
			if(isNaN(this.value)) return;
			let vol = this.sid ? this.tsi : 1;
			this.value = Big(this.value).plus(vol);
		},
		subVal(){
			if(isNaN(this.value)) return;	//數值如果不是數字就不做
			if((!this.sid) && (this.value == 1)) return;	//減少的是手數1的話就不做動作
			let vol = this.sid ? this.tsi : 1;			
			this.value = Big(this.value).minus(vol);
		},
		getValue(bs){
			if(!this.sid)
				return parseFloat(this.value);
			else{
				return this.getFlagPrice(this.flag,bs);
			}
		},
		getFlagPrice(flag,bs){
			let price='';
			switch (flag) {
				case 'latest':
					//最新價 買入/賣出都以最新價發委託
					this.bp = this.qo.p;
					this.sp = this.qo.p;
					return {'price':this.qo.p,'ORDER_TYPE':'LIMIT'};
					break;
				case 'count':
					this.bp = this.qo.sp1;
					this.sp = this.qo.bp1;
					//對方價 買入以賣價發委託，賣出以買價發委託
					price = (bs=='BUY')?this.qo.sp1:this.qo.bp1;
					return {'price':price,'ORDER_TYPE':'HIT'};
					break;
				case 'market':
					//市價 
					price = 0;
					this.bp = price;
					this.sp = price;
					return {'price':price,'ORDER_TYPE':'MARKET'};
					break;
				case 'queue':
					this.bp = this.qo.bp1;
					this.sp = this.qo.sp1;
					//排隊價 買入以買價發委託，賣出以賣價發委託
					price = (bs=='BUY')?this.qo.bp1:this.qo.sp1;
					return {'price':price,'ORDER_TYPE':'LIMIT'};
					break;
				case 'over':
					//對方價 買入以賣價發委託，賣出以買價發委託
					//超價 買入以對方價+N個變動價位發委託，賣出以對方價-N個變動價位發委託
					//這個價位還需調整暫用5個變動價位計算，且浮點運算不一定正確。
					let tsi = M4C.Symbol.getTickSize(this.sid, this.qo.p);
					let x = Big(tsi).times(this.ntsi)	//5個變動價位
					let newSp1 = Big(this.qo.sp1).plus(x);
					let newBp1 = Big(this.qo.bp1).minus(x);
					this.bp = newSp1
					this.sp = newBp1
					price = (bs=='BUY')?newSp1:newBp1;
					return {'price':price,'ORDER_TYPE':'LIMIT'};
					break;
				default:
					//不是旗標價位
					return {'price':parseFloat(this.value),'ORDER_TYPE':'LIMIT'};
					break;
			}
		},
		openM4K(){
			//不帶sid跟m4kType則不呼叫虛擬鍵盤
			if(!this.sid && !this.m4kType) return;

			eventBus.$emit('M4K-DIALOG',{sid:this.sid,type:this.m4kType,cid:this.cid,initVal:this.value,flag:this.flag});
		},
	},
	beforeDestroy() {
		eventBus.$emit('CLOSE-M4K');
		eventBus.$off('SET-M4K-VALUE-'+this.cid);
	},
}
</script>
<style scoped>
input:focus{
	outline: none;
}
.label-text{
	padding:5px;
}

.common-input,.input-block{
	color:white;
	/* min-width:40px; */
	background-color: #141414;
	border:none;
	border-radius: 0 5px 5px 0;
}
.radius{
	border-radius: 5px;
}
.input-block{
	height: 100%;
}
.common-label{
	/* padding: 0 2px; */
	min-width:2em;
	background-color: rgba(100, 100, 100, 0.7);
	border-radius: 5px;
	align-items: center;
	border:1px solid rgba(100, 100, 100, 0.7);
}
.common-label:active{
	border:1px solid yellow;
}
/* input width 100% for flex-1 */
.common-label input {
	width: 100%;
}
.btn{
	/* border:1px solid white; */
	border-radius: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 1px;
}
.ipt{
	flex:1;
}
</style>
