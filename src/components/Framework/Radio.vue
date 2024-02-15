<template>
	<div class="flex-item radio-wrapper" @click="handleChange" ref='radioWrapper'>
		<slot>
		</slot>
	</div>
</template>

<script>
export default {
	data() {
			return {};
	},
	created() {},
	props: ["value", "isRecall", "multiSelect"],
	watch: {
		value(nv, ov){
			this.setFocus(nv);			
		}
	},
	mounted() {
		//設定預設focus
		this.setFocus(this.value);
		// 多選的v-model必須是陣列
		if(this.multiSelect && !Array.isArray(this.value)) this.$emit('input', []);
	},
	methods: {
		handleChange(e){
			eventBus.$emit("SWITCHDATA");
			let val = e.target.getAttribute('value');	//取得點擊的元素及value屬性資料
			let type = e.target.type;					// 非文字元素。ex: input.
			// 點到項目內的元素(非input)且取不到資料時
			if((!type) && (!val) && e.target.closest('.radio-item')) {
				// 搜尋最近的radio-item父元素取value。
				val = e.target.closest('.radio-item').getAttribute('value');
			}
			//有取到正確資料才emit給上層變更v-model的資料。
			if(val){
				//判斷布林、數字、字串
				val = isNaN(val)? (val == "true") || (val == "false")? val == "true": val : Number(val);
				if(this.multiSelect) {
					// if(!this.value) this.$emit('input', []);
					if(this.value.length == 0 || this.value.indexOf(val) < 0){						
						this.value.push(val);
					}
					// 取消選取
					else {
						this.value.splice(this.value.indexOf(val), 1);
					}
					return;
				}
				if(this.isRecall && this.value == val && !this.multiSelect)
					val = "";
				this.$emit('input', val);
			}
		},
		setFocus(val){
			if(this.$slots.default && this.$slots.default.length){
				for( let el of this.$refs.radioWrapper.children){
					if(el){
						let attr = el.getAttribute('value');
						el.classList.remove('focus');
						// 加入各選項class以辨別
						el.classList.add('radio-item');
						let isFocus = false;							
						// 轉換當前元素及設定的值為布林、字串、數字
						// 當前元素
						attr = isNaN(attr)? (attr == "true") || (attr == "false")? attr == "true": attr : Number(attr);
						if(Array.isArray(val)){
							isFocus = val.indexOf(attr) >= 0;
						}
						else {
							// 設定值
							let _val = isNaN(val)? (val == "true") || (val == "false")? val == "true": val : Number(val);
							// 當前元素的值跟設定值一樣
							isFocus = attr == _val;
						}
						if(isFocus)
							el.classList.add('focus');							
					}
				}
			}
		}
	}
};
</script>
<style scoped>
.radio-wrapper {
	border-radius: 2vw;
	overflow: hidden;
	/* 與全系統的 Input/Select 同高 */
	height: 9vw;
}
.radio-wrapper>*{
	display: flex;
	flex:1;
	padding: 0 2.9vw;
	align-items: center;
	text-align: center;
	justify-content: center;
	white-space: nowrap;
}
.focus {
	background-color: rgba(255, 152, 0, 0.932);
}
.disable{
	background-color: gray;
}

/* 桌机版 */
.desktop .radio-wrapper {
	border-radius: 0.25em;
	height: auto;
	border: 1px solid #999;
	box-sizing: border-box;
}
.desktop .radio-wrapper>*{
	padding: 0.1em 0.4em;
}
.desktop .radio-wrapper>*:hover{
	color: aqua;
	cursor: pointer;
}
</style>

