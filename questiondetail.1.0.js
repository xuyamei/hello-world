/*from tccdn minify at 2017-2-23 17:09:31,file：/cn/s/2017/touch/bailvhui/wxhealth/questiondetail.1.0.js?v=7556*/
var both = new Vue({
    el: "#both",
    data: {
        tipOne: '',
        doctor: {},
        doctorImage:'',
        clinic:'',
        problem: {},
        content: [],
        doctorDivShow: false,
        tipTwoShow: false,
        sendDivShow: false,
        remaskShow: false,
        finishDivShow: false,
        timeout: 10000,
        pfirstTime:'',
        dfirstTime:'',
        status:'',
        hour:24,
        tip:'',
        tipshow:false,
        imgUrlArr:[],
        DoctorES:''
    },
    created: function() {
        this.GetHealthProblemDetail();
    },
    methods: {
        GetHealthProblemDetail: function() {
            var that = this;
            var ajaxObj = $.ajax({
                url: '/scenery/GetHealthProblemDetail.html',
                data: 'problemId=' + $("#problemId").val(),
                timeout: this.timeout,
                type: "get",
                success: function(data) {
                    var data = JSON.parse(data);
                    that.SetHealthProblemDetail(data);
                },
                complete: function (XMLHttpRequest, status) {
                    if (status == 'timeout') {
                        ajaxObj.abort();
                        that.showTip("请求超时~");
                    }
                }
            })
        },
        SetHealthProblemDetail:function(data){
        	if(data.problem){
        		this.status=data.problem.status;
        		switch(this.status){
        			case 'n'://新问题
        				this.tipOne="正在分配医生 预计6分钟内回复";
        				this.sendDivShow=true;
        				break;
        			case 's'://已回复
        				this.doctorDivShow=true;
        				this.tipTwoShow=true;
        				this.sendDivShow=true;
        				this.remaskShow=true;
        				break;
        			case 'c'://已关闭
        				this.tipOne="您的问题已达到对话时间";
        				this.doctorDivShow=true;
        				this.tipTwoShow=true;
        				this.finishDivShow=true;
        				break;
        			case 'd'://已评价
                        this.tipOne="您的问题已达到对话时间";
        				this.doctorDivShow=true;
        				this.tipTwoShow=true;
        				break;
        		}
        	}
			this.content=data.content;
			this.pfirstTime=this.DateFormat(this.content[0].created_time_ms);
			//已回复状态 获取医生第一次回复时间
			if(this.status=='s'){
                var dContent=this.content.filter(function (e) {
                    return e.type == 'd';
                });
                this.dfirstTime=this.DateFormat(dContent[0].created_time_ms);
                this.CountDown(this.dfirstTime);
			}
    		//除了新问题状态 都会返回医生详情
            if(this.status!='n'){
                this.doctor=data.doctor;
                this.doctorImage=data.doctor.image;
                this.clinic=this.clinicFormat(data.doctor.clinic);
                maskDiv.doctor=this.doctor;
                maskDiv.clinic=this.clinic;
            } 	
            //除已关闭和已评价状态 会一直监听医生回复
            if(this.status!='c' && this.status!='d'){
                var that=this;
                var isFirst=true;
                this.DoctorES=new EventSource("/scenery/DoctorMsgJson.html?problemId="+$("#problemId").val());
                this.DoctorES.onmessage = function (event) {
                    if (event.data) {
                        if(isFirst){
                            isFirst=false;
                            if(that.status=='n'){
                                //添加医生详情
                                that.doctor=event.data.doctor;
                                that.doctorImage=event.data.doctor.image;
                                that.clinic=that.clinicFormat(event.data.doctor.clinic);
                                maskDiv.doctor=that.doctor;
                                maskDiv.clinic=that.clinic;
                                //获取第一条记录时间进行倒计时
                                that.dfirstTime=that.DateFormat(event.data.time);
                                that.CountDown(that.dfirstTime);
                                //状态变成已回复
                                that.doctorDivShow=true;
                                that.tipTwoShow=true;
                                that.sendDivShow=true;
                                that.remaskShow=true;
                            }
                        }
                        //添加一条医生回复记录
                        var contType=event.data.type=="text" ? 'text' :'file';
                        that.content.push({
                            "id": '',
                            "created_time_ms":'',
                            "type": "d",
                            "content": "[{\""+contType+"\": \""+event.data.msg+"\", \"type\": \""+event.data.type+"\"}]"
                        }) 
                    }        
                };
            }
        },
        CountDown:function(sTime){
        	var nowtime=new Date();
			var pastHour=(nowtime.getTime()-new Date(sTime).getTime())/1000/60/60;
			if(pastHour>=this.hour){
				this.tipOne="您的问题已达到对话时间";
                this.sendDivShow=false;
                this.remaskShow=false;
                this.finishDivShow=true;
                //关闭监听
                this.DoctorES.close();
				return;
			}
			this.hour=this.hour-Math.ceil(pastHour);
			this.tipOne=this.hour+"小时后问题关闭";
            var that=this;
			var cd=setInterval(function() {
				if(that.hour>1){
					that.hour=that.hour-1;
                    that.tipOne=that.hour+"小时后问题关闭";
				}else{
					clearInterval(cd); 
					that.tipOne="您的问题已达到对话时间";
                    that.sendDivShow=false;
                    that.remaskShow=false;
                    that.finishDivShow=true;
                    //关闭监听
                    this.DoctorES.close();
				}
			}, 1000*60*60);
        },
        uploadImg:function(){
            var that=this;
            var picArr=[];
            that.imgUrlArr=[];
            var filelist=that.$refs.file.files;
            if(filelist.length>5){
                that.showTip('最多只能上传5张图片');
                return;
            }
            for(var i=0;i<filelist.length;i++)(function(n){
                var fileone = filelist[n];
                //检测文件类型
                if(fileone.type.indexOf('image') === -1){
                    var fileName = file.name.match(/.([^.]*)$/);
                    if (fileName && fileName.length && fileName[1]) {
                        if (fileName[1].indexOf('png') > -1 || fileName[1].indexOf('jpg') > -1 || fileName[1].indexOf('gif') > -1 || fileName[1].indexOf('jpeg') > -1) {
                        } else {
                            that.showTip('不是图片');
                            return;
                        }
                    } else {
                        that.showTip('不是图片');
                        return;
                    }
                }
                if (fileone.size / (1024 * 1024) > 2) {
                    that.showTip('图片大小不能大于2兆');
                    return;
                }
                if ($.imgReduce.support){
                    $.imgReduce.zip([fileone],function(files){
                        var url = URL.createObjectURL(files[0]);
                        that.imgUrlArr.push(url);
                        picArr.push(files[0]);
                        if(n==(filelist.length-1)){
                            that.uploadImgAjax(picArr);
                        }
                    }, {scale:0.4,quality:0.5,type:'image/jpeg',base64:false})
                }
            })(i)
        },
        uploadImgAjax:function(picArr){
            var that=this;
            if(picArr.length){
                var fd = new FormData();
                for(var i=0;i<picArr.length;i++){
                    fd.append('file'+i,picArr[i]);
                }
                var ajaxObj =$.ajax({
                    type: "POST",
                    url: '/scenery/AskHealthProblem.html?Content=""&TitleId='+$("#titleId").val()+'&MsgType=2',
                    enctype: 'multipart/form-data',
                    data: fd,
                    cache: false,
                    contentType: false,
                    processData: false,
                    dataType: "json",
                    success: function(data) {
                        if (data.State == "100") {
                            that.showTip(data.Message);
                        }else if(data.State == "200"){
                            for(var i in that.imgUrlArr){
                                that.content.push({
                                    "id": '',
                                    "created_time_ms":'',
                                    "type": "p",
                                    "content": "[{\"file\": \""+that.imgUrlArr[i]+"\", \"type\": \"image\"}]"
                                }) 
                            }
                        }
                    },
                    complete: function (XMLHttpRequest, status) {
                        if (status == 'timeout') {
                            ajaxObj.abort();
                            that.showTip("请求超时~");
                        }
                    },
                    error: function(data) {
                       that.showTip("提交失败");
                    }
                })
            }
        },
        openIntro:function(){
        	maskDiv.maskDivShow=true;
    		maskDiv.introDivShow=true;
        },
    	openWrite:function(){
    		maskDiv.maskDivShow=true;
    		maskDiv.writeDivShow=true;
            maskDiv.msg='';
            maskDiv.error=false;
            maskDiv.$refs.word.focus();
    	},
    	openComfirm:function(){
    		maskDiv.maskDivShow=true;
    		maskDiv.comfirmDivShow=true;
    	},
        showTip:function(tip){
            var that=this;
            that.tip=tip;
            that.tipshow=true;
            setTimeout(function() {
                that.tipshow=false;
            }, 2000);
        },
        DateFormat:function(date){
            var date=new Date(Number(date));
            var y=date.getFullYear();
            var m=(date.getMonth()+1) < 10 ? '0'+(date.getMonth()+1) : (date.getMonth()+1);
            var d=date.getDate();
            var h=date.getHours();
            var min=date.getMinutes();
            return y+'-'+m+'-'+d+' '+h+':'+min;
        },
        clinicFormat:function(clinic){
            switch(clinic){
                case '1':
                    return '妇科';
                    break;
                case '2':
                    return '儿科';
                    break;
                case '3':
                    return '内科';
                    break;
                case '4':
                    return '皮肤性病科';
                    break;
                case '6':
                    return '营养科';
                    break;
                case '7':
                    return '骨伤科';
                    break;
                case '8':
                    return '男科';
                    break;
                case '9':
                    return '外科';
                    break;
                case '11':
                    return '肿瘤及防治科';
                    break;
                case '12':
                    return '中医科';
                    break;
                case '13':
                    return '口腔颌面科';
                    break;
                case '14':
                    return '耳鼻咽喉科';
                    break;
                case '15':
                    return '眼科';
                    break;
                case '16':
                    return '整形美容科';
                    break;
                case '17':
                    return '精神心理科';
                    break;
                case '21':
                    return '产科';
                    break;
            }
        },
        goEvaluate:function(){
            window.location.href="/scenery/HealthEvaluate_"+$("#problemId").val()+".html"
        }
    },
    watch:{
        content:{
            handler:function(){
                setTimeout(function() {
                    $(".chatDiv").scrollTop($(".chatDiv >div").height());
                },100);
            },
            deep:true
        }
    }
})

var maskDiv = new Vue({
    el: "#maskDiv",
    data: {
        doctor:'',
        clinic:'',
        maskDivShow: false,
        introDivShow: false,
        writeDivShow: false,
        comfirmDivShow: false,
        msg:'',
        error:false
    },
    methods:{
    	closeMask:function(e){
            if(event.target.className=="maskDiv" || event.target.className=="close" || event.target.className=="reset"){
                this.maskDivShow=false;
                this.introDivShow=false;
                this.writeDivShow=false;
                this.comfirmDivShow=false;
            }
        },
        colseError:function(){
            if(this.msg!=''){
                this.error=false;
            }
        },
        sendMsg:function(){
            var that=this;
            if(that.msg==''){
                that.error=true;
                return;
            }
            var ajaxObj =$.ajax({
                type: "POST",
                url: "/scenery/AskHealthProblem.html?",
                data:'Content='+that.msg+'&TitleId='+$("#titleId").val()+'&MsgType=1',
                dataType: "json",
                success: function(data) {
                    if (data.State == "100") {
                        both.showTip(data.Message);
                    }else if(data.State == "200"){
                        both.content.push({
                            "id": '',
                            "created_time_ms":'',
                            "type": "p",
                            "content": "[{\"text\": \""+that.msg+"\", \"type\": \"text\"}]"
                        }) 
                        that.maskDivShow=false;
                        that.writeDivShow=false;
                    }
                },
                complete: function (XMLHttpRequest, status) {
                    if (status == 'timeout') {
                        ajaxObj.abort();
                        that.showTip("请求超时~");
                    }
                },
                error: function(data) {
                    both.showTip("提问失败");
                }
            })
        },
        goEvaluate:function(){
            window.location.href="/scenery/HealthEvaluate_"+$("#problemId").val()+".html"
        }
    }
})