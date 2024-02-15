<template>
    <div class="date-pick-ctn flex-center">
        <div class=" flex-1 pdl5 flex-start">
            <i class="material-icons icon-right font-size-small">date_range</i>
        </div>
        <div class="date-ctn pdlr3 posr">
            <span class="date-label">{{showDate(startDay)}}</span>
            <input type="date" v-model="startDay" class="start-date-ctn flex-row row-reverse FULL" :max="endDay"/>
        </div>
        <div class="flex-center">{{splitText}}</div>
        <div class="date-ctn pdlr3 posr">
            <span class="date-label">{{showDate(endDay)}}</span>
            <input type="date" v-model="endDay" class="end-date-ctn flex-row row-reverse FULL" v-if="noEndDay" :min="startDay"/>
        </div>
        <div class="flex-1" />
    </div>
</template>
<script>
export default {
    data() {
        return {
            startDay: "",
            endDay: "",
            splitText: "~",
        }
    },
    props:["value", "propNoEndDay"],
    beforeMount() {
        // 設定日期資料
        if(typeof this.value == "object") {
            this.startDay = this.formatDate(this.value.start);
            this.endDay = this.formatDate(this.value.end);
        }
        else if(typeof this.value == "string")
            this.startDay = this.formatDate(this.value);
        // props日期資料則以當下日期為主
        else 
            this.startDay = this.formatDate(new Date().day8());
    },
    methods: {
        // 格式化日期(input type='date'所使用格式ex:2021-05-26)
		formatDate(val) {
            if(val)
			    return `${val.substr(0,4)}-${val.substr(4,2)}-${val.substr(6,2)}`;
		},
        showDate(d) {
            return d.replaceAll('-', '/');
        }
    },
    computed: {
        // 不需要第二日期
        noEndDay() {
            return this.value && typeof this.value !== "string"
        }
    },
    watch: {
        startDay(nv, ov) {
            let _nv = nv.split("-").join("");
            if(typeof this.value == "object") {
                if(_nv > this.endDay.split("-").join("") || !nv){
                    this.startDay = ov;
                    return;
                }
                this.value.start = _nv;
                this.$emit('input', this.value);
            }
            else this.$emit('input', _nv);
        },
        endDay(nv, ov) {
            let _nv = nv.split("-").join("");
            if(typeof this.value == "object") {
                if(_nv < this.startDay.split("-").join("") || !nv){
                    this.endDay = ov;
                    return;
                }
                this.value.end = _nv;
                this.$emit('input', this.value);
            }
        }
    }
}
</script>
<style scoped>
.date-pick-ctn {
    box-sizing: border-box;
}
input {
    background: rgba(0,0,0,0);
    border-width: 0;
    color: white;
    width: 5.5em;
    opacity: 0;
}
input::-webkit-calendar-picker-indicator {
    opacity: 0;
    background: rgba(0, 0, 0, 0);
    position: absolute;
    width: 200px;
    height: 1em;
    background-image: none !important;
}
input::-webkit-inner-spin-button {
    display: none;
    background: none !important;
    width:0;
}
.start-date-ctn, .end-date-ctn {
    min-width: 5em;
    min-height: 1em;
}
/* 出金互轉UI調整-日期 */
.WithdrawalRecord-ctn .date-pick-ctn .pdl5 {
    padding-left: 1vw;
}
/* 出金互轉UI調整-週期日曆ICON */
.WithdrawalRecord-ctn .date-pick-ctn .material-icons{
    font-size: 24px;
}
</style>