<template>
	<div :class="{'border': outBorder}">
		<i v-if="!mode" class="material-icons tcef" :class="{selected: selected}" @click.self="open" :title="$ln(selected ? '删除自选' : '加入自选')">
			{{selected ? this.removeIcon || 'favorite' : this.addIcon || 'favorite_border'}}
		</i>
		<span v-if="mode=='button'" class="btn" :class="[{selected: selected},{disabled: qo$cd < 0}]" @click.self="open">
			{{selected ? '':'+'}}{{$ln(`自选`)}}
		</span>
	</div>
</template>
<script>
export default {
	props: ['symbol', 'mode', 'test', 'addIcon', 'removeIcon', 'outBorder'],
	methods: {
		open(sid){
			// 有帶入 sid 時以帶入的 sid 為主 (仍需考慮指定為主連情境)
			if (typeof(sid)==='string')
				sid = this.displayAsHot ? M4C.Symbol.toHotSymbol(sid) : sid;
			// 沒帶入 sid 時，使用當前 selectedSymbol
			else
				sid = this.sid;

			let grpList = this.$store.state.data.ssgList;
			let options = grpList.map(item => 
				{return {'value' : item.label, 'label' : item.label, 'selected':!(item.param.indexOf(sid) < 0)}
			});
			let self = this;
			// 沒有自選群組跳出提示
			if(!options.length){
				this.$store.state.notify(`请至设定新增自选群组後，再进行操作`);
			}
			// 只有一個自選群組(以關注列表增減後加回自選)
			if(grpList.length === 1){
				let firstSelectGroup = this.$store.state.data.ssgList[0].param;
				let pos = firstSelectGroup.indexOf(sid);
				//被選中的自選群組裡沒有這檔商品就加入自選
				if(pos < 0){
					firstSelectGroup.push(sid);
				}
				//自選群組裡有這檔商品就移除
				else if(pos >= 0){
					firstSelectGroup.splice(pos,1);
				}
				grpList[0].param = firstSelectGroup;
				M4C.SelfGroup.saveGroup(grpList);
			}
			// 跳出勾選清單(因多次調整後已無多組自選，如要重新啟用可能會有問題，需重新調整。)
			else{
				eventBus.$emit("SINGLESELECT-DIALOG", {
					title: this.getTitle(sid),
					options: options,
					type: 'checkbox', //input type類型
					confirmBtn: '完成',
					onClose: () => {
					},
					onfinish: opts => {
						for( let idx = 0; idx < opts.length; idx++){
							//商品如果存在，取出商品的位置
							let pos = grpList[idx].param.indexOf(sid);
							if(opts[idx].selected){
								if(pos < 0){
									//被選中的自選群組裡沒有這檔商品就加入自選
									grpList[idx].param.push(sid);
								}
							}
							else{
								//自選群組裡有這檔商品就移除
								if(pos >= 0){
									grpList[idx].param.splice(pos,1);
								}
							}
						}
						M4C.SelfGroup.saveGroup(grpList);
					}
				});
			}
		},
		getTitle(sid){
			let isHot = M4C.Symbol.isHotSymbol(sid) || M4C.Symbol.isHotSID(sid);
			return `${M4C.Symbol.getContractName(sid)} ${isHot? this.$ln('主连'): M4C.Symbol.getCIDM4(sid)}`;
		}
	},
	computed: {
		qo$cd() {
			return M4C.Quote.getQuoteObject(this.symbol).$cd;
		},
		sid() {
			// 當前顯示為主連情境才要轉
			return this.displayAsHot ? M4C.Symbol.toHotSymbol(this.symbol) : this.symbol;
		},
		selected() {
			return M4C.SelfGroup.checkInGroup(this.sid);
		},
		displayAsHot() {
			return this.$store.state.selectedSymbol.displayAsHot;
		},
	}	
}
</script>
<style scoped>
.tabicon{
	/* margin-right: 10px; */
	font-size: 21px;
}
.selected{
	color:#0BA0FF;
}
.disabled {
	pointer-events: none;
	opacity: 0.8;
}
.btn {
	padding: 2vw 3vw;
	color: black;
	background-color: #FFF;
	border-radius: 3vw;
}
.btn.selected {
	background-color: #F5A623 !important;
}
.border {
	border: 2px solid white;
}
</style>
