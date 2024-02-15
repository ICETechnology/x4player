<template>
	<div class="scrolling-quote-ctn" v-scroll-lock="true">
		<table>
			<thead>
				<tr>
					<th class="vw33">{{$ln('名称')}}</th>
					<th class="vw22">{{$ln('最新价')}}</th>
					<th class="vw22">{{$ln('涨跌')}}</th>
					<th class="vw22">{{$ln('总量')}}</th>
					<th class="vw22">{{$ln('买价')}}</th>
					<th class="vw22">{{$ln('卖价')}}</th>
					<th class="vw22">{{$ln('最高')}}</th>
					<th class="vw22">{{$ln('最低')}}</th>
					<th class="vw22">{{$ln('开盘')}}</th>
					<th class="vw22">{{$ln('昨结')}}</th>
					<th class="vw22">{{$ln('昨收')}}</th>
				</tr>
			</thead>
			<tbody>
				<ScrollingQuoteTr v-for="expandObj in propExpandList" :sid="expandObj.sid" :expandObj="expandObj" :suspend="suspend"></ScrollingQuoteTr>
			</tbody>
		</table>
	</div>
</template>

<script>
import ScrollingQuoteTr from "@/components/ScrollingQuoteTr";

export default {
	props: ["suspend"],
	data() {
		return {
			dataList: [],
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {
		ScrollingQuoteTr,
	},
    methods: {},
	watch: {},
    computed: {
		propExpandList: function() {
			// 改回使用 QuoteMarket 後，暫時不供應 marketExpandList 因此此元件暫停運作
			// return this.$store.state.marketExpandList;
		},
	},
}
</script>

<style>
.scrolling-quote-ctn {
	/* has to be scroll, not auto */
	overflow-y: scroll;
	/* ios scrolling 优化 */
	-webkit-overflow-scrolling: touch;
}

table {
	position: relative;
	border-collapse: collapse;
}

td, th {
	padding: 0.25em;
}

thead th {
	position: -webkit-sticky; /* for Safari */
	position: sticky;
	top: 0;
	background: #000;
	color: #FFF;
	white-space: nowrap;
}

thead th:first-child {
	left: 0;
	z-index: 1;
}

tbody th {
	position: -webkit-sticky; /* for Safari */
	position: sticky;
	left: 0;
	background: #1A1A1A;
}

.vw33 {
	min-width: 33vw;
	max-width: 33vw;
}
.vw22 {
	min-width: 22vw;
	max-width: 22vw;
}

</style>