(function ($) {
    var autoCompleteTable = (function () {

        var defaultOption = {
            method: 'post',
            position:"bottom",
            delay: 400,
            valueField:"Name",
            pageField: "Offset",
            sizeField: "Limit",
            pageIndex: 1,
            pageSize: "5",
            height:250,
            maxHeight:350,
            width:400,
            isEmptySearch:true,
            data: [],
            done:null,
            ajaxBefore:null,
            renderBefore:null,
            column:[]
        };

        function autoCompleteTable(element, options) {
            this.abort;
            this.autoOption = $.extend(true,  {},defaultOption,options || {});
            this.element = element;
            this.element.attr("autocomplete", "off")
            this.init()
        }

        autoCompleteTable.prototype = {
            init: function () {
                var self = this;
                if(this.autoOption.isEmptySearch){
                    $(self.element).off("focus").off("blur");
                    $(self.element).on("focus",{self:self}, function (e) {
                        if($("body > .autoCompleteTable").length)return;
                        $(this).on("keydown",e.data.self.keydown)
                        e.data.self.reload($(this).val())
                    }).on("blur",function(){
                        $(this).off("keydown",self.keydown)
                    })
                }

                $(this.element).off("input propertychange")
                $(this.element).on("input propertychange", throttleFuc(function () {
                    self.reload($(this).val())
                }, self.autoOption.delay))

                $(document).on("click",function(){
                    $("body").children(".autoCompleteTable").remove();
                    self.hide();
                })
            
                $(document).on("click",".autoCompleteTable",function(e){
                    self.stop(e)
                })

                $(self.element).off("click",self.stop)
                $(self.element).on("click",self.stop)
            },
            keydown: function (e) {
                var code = e.keyCode;
                var table = $("body > .autoCompleteTable .table-body")
                if(table.length == 0){
                    $(this).off("keydown")
                    return true;
                }
                if (e.keyCode === 13) {
                    e.preventDefault();
                    var index = table.find("tr.active").click().index();
                    
                }else if (e.keyCode === 38 || e.keyCode === 40) {
                    e.preventDefault();
                    var index = - 1;
                    var tr = table.find("tr");
                    if(tr.length == 0)return false;
    
                    $.each(tr, function (i) {
                        if ($(this).hasClass("active"))index = i;
                    })
                    if(index == - 1){
                        tr.eq(0).addClass("active")
                        table.scrollTop(0)
                        return;
                    }

                    //下
                    if(code == 40){
                        if (index >= tr.length - 1) return;
                        index++;
                    }else if(code == 38){
                        if (index === 0) return;
                        index > 0 ? index-- : index = 0;
                    }
                    var item = tr.eq(index);
                    var tableH = table.get(0).clientHeight;
                    var itemH = item.outerHeight();
                    var offsetT = item[0].offsetTop;
                    var scrollT = table.scrollTop();
                    if (offsetT < scrollT) { //向上移动
                        table.scrollTop(offsetT)
                    } else if (offsetT > scrollT + tableH - itemH) { //向下移动
                        table.scrollTop(offsetT - tableH + itemH);
                    }
                    item.addClass("active").siblings().removeClass("active");
                }
            },
            reload: function (val) {
                var self = this;
                var url = this.autoOption.url
                if(url){
                    var autoOption = this.autoOption;
                    self.popupLoadingRender();
                    self.abort && self.abort.abort();


                    var params = {
                        [autoOption.valueField]: val,
                        [autoOption.pageField]: autoOption.pageIndex,
                        [autoOption.sizeField]: autoOption.pageSize,
                    };
                    if (self.autoOption.ajaxBefore) {
                        params = self.autoOption.ajaxBefore(params);
                    }
                    self.abort = $.ajax({
                        type: this.autoOption.method,
                        url: this.autoOption.url,
                        dataType: "json",
                        data: params,
                        success: function (data) {
                            if(self.autoOption.renderBefore){
                                var rows = self.autoOption.renderBefore(data);
                            }
                            console.log(rows)
                            if(rows === false){
                                $("body > .autoCompleteTable").find(".table-body").empty().append("<div class='loading'><span>请求出错</span></div>")
                            }else if(rows.length == 0){
                                $("body > .autoCompleteTable").find(".table-body").empty().append("<div class='loading'><span>没有数据</span></div>")
                            }else{
                                self.popupRender(rows);
                            }
                        },
                        error: function () {
                            $("body > .autoCompleteTable").find(".loading span").html("请求出错")
                            self.autoOption.error && self.autoOption.error();
                        }
                    });
                }else{
                    var data = self.autoOption.data;
                    if(self.autoOption.renderBefore){
                        data = self.autoOption.renderBefore(data);
                    }
                    self.popupRender(data);
                }
            },
            popupLoadingRender:function(){
                var popup = $("body > .autoCompleteTable");
                if(!popup.length){
                    popup = $("<div class='autoCompleteTable'></div>");
                    $("body").append(popup);
                }
                var width = this.autoOption.width;
                var height = this.autoOption.height;
                var input = this.element;
                // popup.empty();
                var tableHeader = this.tableHeaderRender()
                popup.append(tableHeader)
                popup.append("<div class='table-body'></div>")
                var tableBody = popup.find(".table-body")
                tableBody.empty().append("<div class='loading'><span>加载中...</span></div>")
                tableBody.css("height",height - tableHeader.height() + 19)
                var top
                if(this.autoOption.position == "bottom"){
                    top = input.offset().top + input.height() + 10;
                }else{
                    top = input.offset().top - height - 5
                }
                popup.css({width:width,height:height,left:input.offset().left,top:top})

            },
            popupRender:function(data){
                this.listData = data;
                var self = this;
                var popup = $("body > .autoCompleteTable");
                if(!popup.length){
                    popup = $("<div class='autoCompleteTable'></div>");
                    $("body").append(popup);
                }
                
                
                // var tableBody = this.tableBodyRender(data)
                var tableBody = popup.find(".table-body");
                // tableBody.css("height",height - tableHeader.height() + 19)

                tableBody.empty().append(this.tableBodyRender(data))
                

                tableBody.on("scroll",function(e){
                    self.stop(e);
                    tableHeader.scrollLeft($(this).scrollLeft());
                })

                tableBody.find("tr").on("click",function(){
                    var index = $(this).index();
                    $(this).addClass("active").siblings().removeClass("active")
                    self.element.blur();
                    self.done && self.done(index);
                })
            },
            tableHeaderRender(){
                var column = this.autoOption.column;
                var tableHeader = $("<div class='table-header'><table class='layui-table'><thead><tr></tr></thead></table></div>")
                var tableHeaderTr = tableHeader.find("tr");
                for(var i=0;i<column.length;i++){
                    var item = column[i];
                    var th = $("<th align='" + (item.headerAlign ? item.headerAlign : 'center')  +"'><div>" + item.name +"</div></th>")
                    th.children("div").css("min-width",item.width || 80);
                    tableHeaderTr.append(th);
                }
                return tableHeader
            },
            tableBodyRender(data){
                var column = this.autoOption.column;
                var tableBody = $("<table class='layui-table'><tbody></tbody></table>")
                for(var i=0;i<data.length;i++){
                    var tr = $("<tr></tr>")
                    for(var j=0;j<column.length;j++){
                        var item = column[j];
                        var td = $("<td align='" + (item.align ? item.align : 'left')  +"'><div>" + (data[i][item.key] || "") +"</div></td>")
                        td.children("div").css("min-width",item.width || 80);
                        tr.append(td);
                    }
                    tableBody.find("tbody").append(tr);
                }
                return tableBody;
            },
            stop:function(e){
                e.stopPropagation();
                e.preventDefault();
            },
            done:function(index){
                this.autoOption.done && this.autoOption.done(this.listData[index],this.element)
                if(!this.element.is(":focus"))this.hide();
            },
            hide:function(){
                $("body > .autoCompleteTable").remove();
            }
        };

        return autoCompleteTable;

    })();

    // 创建对象实例
    $.fn.autoCompleteTable = function (options) {
        // 实现链式调用
        return this.each(function () {
            var me = $(this),
                instance = me.data("autoCompleteTable");
            // 判断实例是否存在，不存在则创建对象，并将该对象及配置项传入
            if (!instance) {
                instance = new autoCompleteTable(me, options);
                // 存放实例
                me.data("autoCompleteTable", instance);
            }
            if ($.type(options) === "String") {
                return instance[options]();
            }
        });
    };


    //节流
    var throttleFuc = function (fn, delay) {
        var timer = null;
        return function () {
            var context = this,
                args = arguments;
            clearTimeout(timer);
            timer = setTimeout(function () {
                fn.apply(context, args);
            }, delay);
        };
    };
})(jQuery)