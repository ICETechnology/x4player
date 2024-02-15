<template>
	<div class="flex-item subjectwrapper">
		<div class="flex-column flex-1d5 label">
			<span class="gray">标的</span><span>{{sname||qo.sn}}</span>
		</div>
		<div class="flex-column flex-1">
			<div class="flex-1"><span class="gray pr-5">买</span><span class="clr-up">{{qo.bp1}}</span></div>
			<div class="flex-1"><span class="gray pr-5">卖</span><span class="clr-dn">{{qo.sp1}}</span></div>
		</div>
		<div :class="['flex-column', 'flex-1', 'finalprice', qo.$clr]">
			<span>{{qo.p}}</span><span>{{qo.q}}{{makeChangeRateText}}</span>
		</div>
	</div>
</template>
<script>
export default {
	props: ['sid'],
	data(){
		return{
			qo: {},
			sname: "",
		}
	},
	watch:{
		sid: function(newSid, oldSid){
			this.sid = newSid;
			this.sname = M4C.Symbol.getCNM4(this.sid);
			this.qo = M4C.Quote.getQuoteObject(this.sid);
			M4C.Quote.unsub(oldSid, this);
			M4C.Quote.sub(this.sid, this);
		}
	},
	computed: {
		makeChangeRateText: function() {
			if (!this.qo.s) return '';
			if (this.qo.chg==null || this.qo.r==null) return '';
			return "(" + (this.qo.chg / this.qo.r * 100).toFixed(2) + "%)";
		},
	},
	mounted() {},
	beforeDestroy() {
		M4C.Quote.unsub(this.sid, this);
	},
	methods: {},
}
</script>
<style scoped>
.subjectwrapper{
	padding:10px 0;
}
.label>*:last-child{
	font-size: 1.5em;
}
.finalprice{
	border-left:1px solid #333;
	text-align: right;
}
.finalprice>*:first-child{
	font-size: 1.5em;
}
.gray {
	color: gray;
}
.pr-5{
	padding-right:5px;
}
</style>

