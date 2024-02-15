<template>
	<div class="quote-table-ctn">
		<table>
			<thead>
				<th>名稱</th>
				<th>成交價</th>
				<th>漲跌</th>
				<th>參考價</th>
				<th>買價</th>
				<th>賣價</th>
				<th>買量</th>
				<th>賣量</th>
				<th>單量</th>
				<th>總量</th>
			</thead>
			<tbody>
				<tr v-for="sid in sidList">
					<td>
						<span class="hidden">{{qo.SimpleName}}</span>
						<span :class="['s-name']">{{sidQO[sid].SimpleName + sidQO[sid].Month}}</span>
					</td>
					<td class="text-align-right">
						<span :class="comparePrice(sidQO[sid], sidQO[sid].p)">{{sidQO[sid].p}}</span>
					</td>
					<td class="text-align-right">
						<span :class="comparePrice(sidQO[sid], sidQO[sid].p)">{{prefixSymbol}}{{Math.abs(sidQO[sid].Change)}}</span>
					</td>
					<td class="text-align-right">
						<span :class="['s-price']">{{sidQO[sid].ReferencePrice}}</span>
					</td>
					<td class="text-align-right">
						<span :class="comparePrice(sidQO[sid], sidQO[sid].Bid)">{{sidQO[sid].Bid}}</span>
					</td>
					<td class="text-align-right">
						<span :class="comparePrice(sidQO[sid], sidQO[sid].Ask)">{{sidQO[sid].Ask}}</span>
					</td>
					<td class="text-align-right">
						<span :class="['s-volume']">{{sidQO[sid].BBUYVOL}}</span>
					</td>
					<td class="text-align-right">
						<span :class="['s-volume']">{{sidQO[sid].BSELLVOL}}</span>
					</td>
					<td class="text-align-right">
						<span :class="['s-volume']">{{sidQO[sid].TradeQuantity}}</span>
					</td>			
					<td class="text-align-right">
						<span :class="['s-volume']">{{sidQO[sid].TradeVolume}}</span>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>

<script>
export default {
	props: ['sidObjList', 'isVisible'],
	data() {
		return {
			sidList: [],
			sidQO: {},
			qo: {},
			udClass: '',
			prefixSymbol: '',
		}
	},
	mounted() {
		this.sidObjList.forEach((elm)=>{
			this.sidList.push(elm.sid);
			this.sidQO[elm.sid] = {};
		});
		M4C.Quote.sub(this.sidList, this);

		this.onQuote = (quote) => {
			let sid = quote.Symbol;
			// this.sidQO[sid] = quote;
			// this.$set(this.sidQO, sid, quote);
			this.qo = quote;
			this.sidQO[sid] = quote;
			
			// if (quote.Change > 0) {
			// 	this.udClass = 'up';
			// 	this.prefixSymbol = '▲';
			// } else if (quote.Change < 0) {
			// 	this.udClass = 'dn';
			// 	this.prefixSymbol = '▼';
			// } else {
			// 	this.udClass = 'ref';
			// 	this.prefixSymbol = '';
			// }
		};
		// M4C.Quote.sub(this.sid, this);
	},
	computed: {
		ChangeRate: function() {
			return "(" + (this.qo.Change / this.qo.ReferencePrice * 100).toFixed(2) + "%)";
		}
	},
	methods: {
		comparePrice: function(qo, price) {
			let udf = (price > qo.ReferencePrice) ? 'up' : (price < qo.ReferencePrice ? 'dn' : 'ref');
			return "s-price " + udf;
		},
	},
	watch: {
		isVisible: function(newVal, oldVal) {
			if (newVal && !oldVal)
				M4C.Quote.sub(this.sid, this);
			if (!newVal && oldVal)
				M4C.Quote.unsub(this.sid, this);
		}
	}
}
</script>

<style>
.quote-table-ctn {
	padding: 4px 8px;
}
.quote-table-ctn table {
	width: 100%;
	border-collapse: collapse;
	border-spacing: 0;
}
.quote-table-ctn table th,
.quote-table-ctn table td {
	white-space: nowrap;
	min-width: 40px;
	padding: 2px 4px;
	border: 1px solid #DDD;
}

.quote-table-ctn .s-name {
	color: blue;
}
.quote-table-ctn .text-align-right {
	text-align: right;
}
.quote-table-ctn .s-price.up {
	color: #f60000;
}
.quote-table-ctn .s-price.dn {
	color: #00d200;
}
.quote-table-ctn td {
	width: 25%;
	max-width: 25%;
}
.quote-table-ctn td .head {
	color: #AAA;
	font-size: 0.5em;
	margin-bottom: -5px;
}
</style>