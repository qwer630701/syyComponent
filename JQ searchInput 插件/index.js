(function ($) {
    var autoCompleteTable = (function () {

        var defaultOption = {
            method: 'get',
            delay: 400,
            pageField: "offset",
            sizeField: "limit",
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
            this.option = $.extend(true, defaultOption, options || {});
            this.element = element;
            this.element.attr("autocomplete", "off")
            this.init()
        }

        autoCompleteTable.prototype = {
            init: function () {
                var self = this;
                if(this.option.isEmptySearch){
                    console.log(this.element)
                    $(this.element).off("focus").off("blur");
                    $(this.element).on("focus", function () {
                        $(this).on("keydown",self.keydown)
                        self.reload($(this).val())
                    }).on("blur",function(){
                        $(this).off("keydown",self.keydown)
                    })
                }

                $(this.element).off("input propertychange")
                $(this.element).on("input propertychange", throttleFuc(function () {
                    console.log("input propertychange")
                    self.reload($(this).val())
                }, this.option.delay))

                $(document).on("click",function(){
                    $("body").children(".autoCompleteTable").remove();
                    self.hide();
                })
            
                $(document).on("click",".autoCompleteTable",function(e){
                    self.stop(e)
                })

                $(this.element).off("click",self.stop)
                $(this.element).on("click",self.stop)
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
                var url = this.option.url
                if(url){
                    self.dropdownLoading();
                    self.abort && self.abort.abort();
                    var data = {
                        [this.option.urlKey]: val
                    };
                    if (this.option.ajaxBefore) {
                        data = this.option.ajaxBefore(data);
                    }
                    self.abort = $.ajax({
                        type: this.option.method,
                        url: this.option.url,
                        dataType: "json",
                        data: data,
                        success: function (data) {
                            if(self.option.renderBefore){
                                data = self.option.renderBefore(data);
                            }
                            self.popupRender(data);
                        },
                        error: function () {
                            self.option.error && self.option.error();
                        }
                    });
                }else{
                    var data = this.option.data;
                    if(self.option.renderBefore){
                        data = self.option.renderBefore(data);
                    }
                    this.popupRender(data);
                }
            },
            popupRender:function(data){
                this.listData = data;
                var self = this;
                var popup = $("body > .autoCompleteTable");
                if(!popup.length){
                    popup = $("<div class='autoCompleteTable layui-anim layui-anim-upbit'></div>");
                    $("body").append(popup);
                }
                
                var tableHeader = this.tableHeaderRender()
                var tableBody = this.tableBodyRender(data)
                popup.empty();
                popup.append(tableHeader)
                popup.append(tableBody)
                
                var width = this.option.width;
                var height = this.option.height;
                var input = this.element;
                tableBody.css("max-height",height - tableHeader.height() + 19)
                popup.css({width:width,height:height,left:input.offset().left,top:input.offset().top + input.height() + 10})

                tableBody.on("scroll",function(e){
                    self.stop(e);
                    tableHeader.scrollLeft($(this).scrollLeft());
                })

                tableBody.find("tr").on("click",function(){
                    var index = $(this).index();
                    $(this).addClass("active").siblings().removeClass("active")
                    self.done && self.done(index);
                })
            },
            tableHeaderRender(){
                var column = this.option.column;
                var tableHeader = $("<div class='table-header'><table class='layui-table'><thead><tr></tr></thead></table></div>")
                var tableHeaderTr = tableHeader.find("tr");
                for(var i=0;i<column.length;i++){
                    var item = column[i];
                    var th = $("<th align='" + (item.headerAlign ? item.headerAlign : 'center')  +"'><div>" + item.name +"</div></th>")
                    th.children("div").css("width",item.width || 80);
                    tableHeaderTr.append(th);
                }
                return tableHeader
            },
            tableBodyRender(data){
                var column = this.option.column;
                var tableBody = $("<div class='table-body'><table class='layui-table'><tbody></tbody></table></div>")
                for(var i=0;i<data.length;i++){
                    var tr = $("<tr></tr>")
                    for(var j=0;j<column.length;j++){
                        var item = column[j];
                        var td = $("<td align='" + (item.align ? item.align : 'left')  +"'><div>" + (data[i][item.key] || "") +"</div></td>")
                        td.children("div").css("width",item.width || 80);
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
                this.option.done && this.option.done(this.listData[index],this.element)
                this.hide();
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