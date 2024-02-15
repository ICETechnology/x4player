<template>
    <div class="warrant-table-ctn flex-center overflow-hidden">
		<MTable :refresh="true" @refresh="onRefresh" :slideRate="1" v-stop-propagation-y>
			<thead>
				<th>{{`${$ln('时间')} / ${$ln('合约')}`}}</th>
				<th>{{$ln('执行类型')}}</th>
				<th>{{$ln('数量')}}</th>
				<th>{{$ln('状态')}}</th>
				<th>{{$ln('备注')}}</th>
			</thead>
			<tbody>
				<tr v-for="obj in positionLockReportList">
					<td class="posr">
						<div class="FULL flex-col flex-center">
							<div>{{updateTime(obj.UPDATE_TIME)}}</div>
							<div>{{symbolName(obj.SYMBOL)}}</div>
						</div>
					</td>
					<td>{{txtType(obj.TYPE)}}</td>
					<td>{{obj.QTY}}</td>
					<td v-html="execResult(obj.STATUS)"></td>

					<!-- 備註長度低於 8 : 顯示為一般文字 -->
					<td v-if="!displayMemoLink(obj)" class="td-memo ellipsis">{{displayMemo(obj)}}</td>
					<!-- 備註長度超過 8 : 顯示為可點擊的連結，點擊後彈出完整內容 -->
					<td v-if="displayMemoLink(obj)" class="td-memo ellipsis">
						<span class="clr-aqua underline" @click="popupMemo(obj)">{{displayMemo(obj)}}</span>
					</td>
				</tr>
			</tbody>
		</MTable>
    </div>
</template>

<script>
export default {
	props: ["positionLockReportList"],
	data() {
		return {

		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		onRefresh() {
			this.$emit("refresh");
		},
		txtType(type) {
			if (type === "LOCK")
				return "锁定";
			else if (type === "UNLOCK")
				return "解锁";
			else
				return type;
		},
		/** 合約 */
		symbolName(sid) {
			return M4C.Symbol.getContractName(sid);
		},
		/** 時間 */
		updateTime(d) {
			// return new Date(d).dayTime18();
			return new Date(d).time8();
		},
		/** 執行結果/備註 */
		execResult(status) {
			let result = status;
			switch(status) {
				case 'PendingNew':
					result = `${this.$ln('申请中')}`;
					break;
				case 'New':
					result = `<span class="clr-filled">${this.$ln('执行成功')}</span>`;
					break;
				case 'Rejected':
					result = `<span class="clr-warn">${this.$ln('执行失败')}</span>`;
					break;
			}
			return result;
		},
		displayMemo(obj) {
			if(obj) {
				// 失敗時顯示DCore的訊息(代碼轉語系);
				let msg = obj.CODE < 0? this.$ln(`TRADE_${obj.CODE}`): "";
				return obj.MEMO || msg || this.$ln(`无备注`);
			}
		},
		displayMemoLink(obj) {
			let memo = this.displayMemo(obj);
			return memo && memo.length > 8;
		},
		popupMemo(obj) {
			eventBus.$emit("CONFIRM-DIALOG", {
				title: this.$ln("备注"),
				content: obj.MEMO,
				confirmOnly: true,
			});
		},
	},
	watch: {},
    computed: {},
}
</script>

<style scoped>
td {
	height: 9vw;
}
.td-memo {
	max-width: 80px;
	padding-left: 2px !important;
	padding-right: 2px !important;
}

/** 桌機版 */
.desktop td {
	height: 1.8em;
}
</style>