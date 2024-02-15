<template>
    <div class="log-container">
        <div class="log-line" v-for="item in items">
            <span class="date-time">{{ item.datetime }}</span>
            <span class="tag" :class="'type'+item.type">{{ item.tag }}</span>
            <span class="log-content">{{ item.message }}</span>
        </div>
    </div>
</template>

<script>
export default {
	data () {
		return {
			items: [],
		}
	},
	props: ['prepend'],
	mounted: function() {
		let self = this;
        eventBus.$on('LOGIT', (str, type)=>{
			if (typeof str === "object")
				str = JSON.stringify(str, null, "\t");
			let data = {
				type: type,
				datetime: this.getFullDateTimeString(),
				tag: type==1 ? "REQUEST" : type==2 ? "RESPONSE" : type==3 ? 'TEST' : 'SYS',
				message: str,
				isSend: type==1,
				isResp: type==2
			};
			if (self.prepend)
				this.items.unshift(data);
			else
				this.items.push(data);
        });
	},
	methods: {
		getFullDateTimeString(date) {
			date = date || new Date();
			return "{0}/{1}/{2} {3}:{4}:{5}.{6}".format(
				date.getFullYear(),
				('00' + (date.getMonth() + 1)).substr(-2),
				('00' + (date.getDay())).substr(-2),
				('00' + (date.getHours())).substr(-2),
				('00' + (date.getMinutes())).substr(-2),
				('00' + (date.getSeconds())).substr(-2),
				('00' + (date.getTime() % 1000)).substr(-3)
			);
		}
	}
}
</script>

<style>
.log-container {
	text-align: left;
	padding: 4px;
	overflow-y: scroll;
	word-break: break-word;
	height: 100%;
    font-family: "Roboto Mono", Monaco, courier, monospace;
    font-size: 0.4em;
    background-color: #f8f8f8;
    -webkit-font-smoothing: initial;	
}
.log-container .log-line {
	margin: 4px 0;
}
.log-container .date-time {
	color: #999;
	margin: 0 4px;
}
.log-container .tag {
	display: inline-block;
	width: 100px;
	border: 1px solid black;
	border-radius: 3px;
	cursor: pointer;
	text-align: center;
}
.log-container .type1 {
	color: blue;
	border: 1px solid blue;
}
.log-container .type2 {
	color: red;
	border: 1px solid red;
}
.log-container .type3 {
	color: white;
	background-color: gray;
	border: 1px solid gray;
}

.log-container .log-content {
	word-break: break-word;
}
.log-container .log-content.formatted{
	white-space: pre;
}
</style>
