(function () {
    var ui = glinamespace("gli.ui");

    var DrawInfo = function (context, name) {
        glisubclass(gli.ui.PopupWindow, this, [context, name, "Draw Info", 863, 600]);
    };

    DrawInfo.prototype.setup = function () {
        var self = this;
        var context = this.context;
        var doc = this.browserWindow.document;
        var gl = context;

        // TODO: toolbar buttons/etc

        // TODO: move to shared code
        function prepareCanvas(canvas) {
            var frag = doc.createDocumentFragment();
            frag.appendChild(canvas);
            var gl = null;
            try {
                if (canvas.getContextRaw) {
                    gl = canvas.getContextRaw("experimental-webgl");
                } else {
                    gl = canvas.getContext("experimental-webgl");
                }
            } catch (e) {
                // ?
                alert("Unable to create pixel history canvas: " + e);
            }
            gli.enableAllExtensions(gl);
            gli.hacks.installAll(gl);
            return gl;
        };
        this.canvas = doc.createElement("canvas");
        this.gl = prepareCanvas(this.canvas);

        this.previewer = new gli.ui.TexturePreviewGenerator();
    };

    DrawInfo.prototype.dispose = function () {
        this.canvas = null;
        this.gl = null;
    };

    DrawInfo.prototype.clear = function () {
        var doc = this.browserWindow.document;
        doc.title = "Draw Info";
        this.elements.innerDiv.innerHTML = "";
    };

    DrawInfo.prototype.addCallInfo = function (frame, call, drawInfo) {
        var doc = this.browserWindow.document;
        var gl = this.gl;
        var innerDiv = this.elements.innerDiv;

        var panel = this.buildPanel();

        // Call line
        var callLine = doc.createElement("div");
        callLine.className = "drawinfo-call";
        gli.ui.appendCallLine(this.context, callLine, frame, call);
        panel.appendChild(callLine);

        // ELEMENT_ARRAY_BUFFER (if an indexed call)
        if (call.name == "drawElements") {
            var elementArrayLine = doc.createElement("div");
            elementArrayLine.className = "drawinfo-elementarray trace-call-line";
            elementArrayLine.style.paddingLeft = "42px !important";
            elementArrayLine.innerHTML = "ELEMENT_ARRAY_BUFFER: "
            gli.ui.appendObjectRef(this.context, elementArrayLine, drawInfo.args.elementArrayBuffer);
            panel.appendChild(elementArrayLine);
            gli.ui.appendClear(panel);
        }

        gli.ui.appendClear(innerDiv);
        gli.ui.appendbr(innerDiv);
        
        // TODO: output canvases
        innerDiv.appendChild(doc.createTextNode("TODO: output canvases"));

        gli.ui.appendClear(innerDiv);
        gli.ui.appendbr(innerDiv);
    };

    DrawInfo.prototype.appendTable = function (el, drawInfo, name, tableData, valueCallback) {
        var doc = this.browserWindow.document;
        var gl = this.gl;

        // [ordinal, name, size, type, optional value]
        var table = doc.createElement("table");
        table.className = "program-attribs";

        var tr = doc.createElement("tr");
        var td = doc.createElement("th");
        td.innerHTML = "idx";
        tr.appendChild(td);
        td = doc.createElement("th");
        td.className = "program-attribs-name";
        td.innerHTML = name + " name";
        tr.appendChild(td);
        td = doc.createElement("th");
        td.innerHTML = "size";
        tr.appendChild(td);
        td = doc.createElement("th");
        td.className = "program-attribs-type";
        td.innerHTML = "type";
        tr.appendChild(td);
        if (valueCallback) {
            td = doc.createElement("th");
            td.className = "program-attribs-value";
            td.innerHTML = "value";
            tr.appendChild(td);
        }
        table.appendChild(tr);

        for (var n = 0; n < tableData.length; n++) {
            var row = tableData[n];

            var tr = doc.createElement("tr");
            td = doc.createElement("td");
            td.innerHTML = row[0];
            tr.appendChild(td);
            td = doc.createElement("td");
            td.innerHTML = row[1];
            tr.appendChild(td);
            td = doc.createElement("td");
            td.innerHTML = row[2];
            tr.appendChild(td);
            td = doc.createElement("td");
            switch (row[3]) {
                case gl.FLOAT:
                    td.innerHTML = "FLOAT";
                    break;
                case gl.FLOAT_VEC2:
                    td.innerHTML = "FLOAT_VEC2";
                    break;
                case gl.FLOAT_VEC3:
                    td.innerHTML = "FLOAT_VEC3";
                    break;
                case gl.FLOAT_VEC4:
                    td.innerHTML = "FLOAT_VEC4";
                    break;
                case gl.INT:
                    td.innerHTML = "INT";
                    break;
                case gl.INT_VEC2:
                    td.innerHTML = "INT_VEC2";
                    break;
                case gl.INT_VEC3:
                    td.innerHTML = "INT_VEC3";
                    break;
                case gl.INT_VEC4:
                    td.innerHTML = "INT_VEC4";
                    break;
                case gl.BOOL:
                    td.innerHTML = "BOOL";
                    break;
                case gl.BOOL_VEC2:
                    td.innerHTML = "BOOL_VEC2";
                    break;
                case gl.BOOL_VEC3:
                    td.innerHTML = "BOOL_VEC3";
                    break;
                case gl.BOOL_VEC4:
                    td.innerHTML = "BOOL_VEC4";
                    break;
                case gl.FLOAT_MAT2:
                    td.innerHTML = "FLOAT_MAT2";
                    break;
                case gl.FLOAT_MAT3:
                    td.innerHTML = "FLOAT_MAT3";
                    break;
                case gl.FLOAT_MAT4:
                    td.innerHTML = "FLOAT_MAT4";
                    break;
                case gl.SAMPLER_2D:
                    td.innerHTML = "SAMPLER_2D";
                    break;
                case gl.SAMPLER_CUBE:
                    td.innerHTML = "SAMPLER_CUBE";
                    break;
            }
            tr.appendChild(td);

            if (valueCallback) {
                td = doc.createElement("td");
                valueCallback(n, td);
                tr.appendChild(td);
            }

            table.appendChild(tr);
        }

        el.appendChild(table);
    };

    DrawInfo.prototype.appendUniformInfos = function (el, drawInfo) {
        var self = this;
        var doc = this.browserWindow.document;
        var gl = this.gl;

        var uniformInfos = drawInfo.uniformInfos;
        var tableData = [];
        for (var n = 0; n < uniformInfos.length; n++) {
            var uniformInfo = uniformInfos[n];
            tableData.push([uniformInfo.index, uniformInfo.name, uniformInfo.size, uniformInfo.type]);
        }
        this.appendTable(el, drawInfo, "uniform", tableData, function (n, el) {
            var uniformInfo = uniformInfos[n];
            if (uniformInfo.textureValue) {
                // Texture value
                var texture = uniformInfo.textureValue;

                var samplerDiv = doc.createElement("div");
                samplerDiv.className = "drawinfo-sampler-value";
                samplerDiv.innerHTML = "Sampler: " + uniformInfo.value;
                el.appendChild(samplerDiv);
                el.innerHTML += "&nbsp;";
                gli.ui.appendObjectRef(self.context, el, uniformInfo.textureValue);

                if (texture) {
                    var item = self.previewer.buildItem(self, doc, gl, texture, false, false);
                    item.className += " drawinfo-sampler-thumb";
                    el.appendChild(item);
                }
            } else {
                // Normal value
                switch (uniformInfo.type) {
                    case gl.FLOAT_MAT2:
                    case gl.FLOAT_MAT3:
                    case gl.FLOAT_MAT4:
                        ui.appendMatrices(el, uniformInfo.type, uniformInfo.size, uniformInfo.value);
                        break;
                    default:
                        // TODO: prettier display
                        el.innerHTML = uniformInfo.value;
                        break;
                }
            }
        });
    };

    DrawInfo.prototype.appendAttribInfos = function (el, drawInfo) {
        var self = this;
        var doc = this.browserWindow.document;
        var gl = this.gl;

        var attribInfos = drawInfo.attribInfos;
        var tableData = [];
        for (var n = 0; n < attribInfos.length; n++) {
            var attribInfo = attribInfos[n];
            tableData.push([attribInfo.index, attribInfo.name, attribInfo.size, attribInfo.type]);
        }
        this.appendTable(el, drawInfo, "attribute", tableData, function (n, el) {
            var attribInfo = attribInfos[n];
            if (attribInfo.state.buffer) {
                el.innerHTML = "Buffer: ";
                gli.ui.appendObjectRef(self.context, el, attribInfo.state.buffer);
                var typeString;
                switch (attribInfo.state.type) {
                    case gl.BYTE:
                        typeString = "BYTE";
                        break;
                    case gl.UNSIGNED_BYTE:
                        typeString = "UNSIGNED_BYTE";
                        break;
                    case gl.SHORT:
                        typeString = "SHORT";
                        break;
                    case gl.UNSIGNED_SHORT:
                        typeString = "UNSIGNED_SHORT";
                        break;
                    default:
                    case gl.FLOAT:
                        typeString = "FLOAT";
                        break;
                }
                var specifierSpan = document.createElement("span");
                specifierSpan.innerHTML = " +" + attribInfo.state.pointer + " / " + attribInfo.state.size + " * " + typeString + (attribInfo.state.normalized ? " N" : "");
                el.appendChild(specifierSpan);
            } else {
                el.innerHTML = "Constant: ";
                // TODO: pretty print
                el.innerHTML += attribInfo.state.value;
            }
        });
    };

    DrawInfo.prototype.addProgramInfo = function (frame, call, drawInfo) {
        var doc = this.browserWindow.document;
        var gl = this.gl;
        var innerDiv = this.elements.innerDiv;

        var panel = this.buildPanel();

        // Name
        var programLine = doc.createElement("div");
        programLine.className = "drawinfo-program trace-call-line";
        programLine.innerHTML = "<b>Program</b>: ";
        gli.ui.appendObjectRef(this.context, programLine, drawInfo.program);
        panel.appendChild(programLine);
        gli.ui.appendClear(panel);
        gli.ui.appendClear(innerDiv);
        gli.ui.appendbr(innerDiv);

        // Uniforms
        this.appendUniformInfos(innerDiv, drawInfo);
        gli.ui.appendbr(innerDiv);

        // Vertex attribs
        this.appendAttribInfos(innerDiv, drawInfo);
        gli.ui.appendbr(innerDiv);
    };

    DrawInfo.prototype.addStateInfo = function (frame, call, drawInfo) {
        var doc = this.browserWindow.document;
        var gl = this.gl;
        var innerDiv = this.elements.innerDiv;

        var panel = this.buildPanel();
        
        var programLine = doc.createElement("div");
        programLine.className = "drawinfo-program trace-call-line";
        programLine.innerHTML = "<b>State</b>";
        // TODO: link to state object
        panel.appendChild(programLine);
        gli.ui.appendClear(panel);
        gli.ui.appendClear(innerDiv);
        
        var vertexState = [
            "CULL_FACE",
            "CULL_FACE_MODE",
            "FRONT_FACE",
            "LINE_WIDTH"
        ];
        
        var fragmentState = [
            "BLEND",
            "BLEND_EQUATION_RGB",
            "BLEND_EQUATION_ALPHA",
            "BLEND_SRC_RGB",
            "BLEND_SRC_ALPHA",
            "BLEND_DST_RGB",
            "BLEND_DST_ALPHA",
            "BLEND_COLOR"
        ];
        
        var depthStencilState = [
            "DEPTH_TEST",
            "DEPTH_FUNC",
            "DEPTH_RANGE",
            "POLYGON_OFFSET_FILL",
            "POLYGON_OFFSET_FACTOR",
            "POLYGON_OFFSET_UNITS",
            "STENCIL_TEST",
            "STENCIL_FUNC",
            "STENCIL_REF",
            "STENCIL_VALUE_MASK",
            "STENCIL_FAIL",
            "STENCIL_PASS_DEPTH_FAIL",
            "STENCIL_PASS_DEPTH_PASS",
            "STENCIL_BACK_FUNC",
            "STENCIL_BACK_REF",
            "STENCIL_BACK_VALUE_MASK",
            "STENCIL_BACK_FAIL",
            "STENCIL_BACK_PASS_DEPTH_FAIL",
            "STENCIL_BACK_PASS_DEPTH_PASS"
        ];
        
        var outputState = [
            "VIEWPORT",
            "SCISSOR_TEST",
            "SCISSOR_BOX",
            "COLOR_WRITEMASK",
            "DEPTH_WRITEMASK",
            "STENCIL_WRITEMASK",
            "FRAMEBUFFER_BINDING"
            // TODO: RTT / renderbuffers/etc
        ];
        
        function generateStateTable(el, name, state, enumNames) {
            var titleDiv = document.createElement("div");
            titleDiv.className = "info-title-master";
            titleDiv.innerHTML = name;
            el.appendChild(titleDiv);
            
            var table = document.createElement("table");
            table.className = "info-parameters";
    
            var stateParameters = gli.info.stateParameters;
            for (var n = 0; n < enumNames.length; n++) {
                var enumName = enumNames[n];
                var param = stateParameters[enumName];
                gli.ui.appendStateParameterRow(this.window, gl, table, state, param);
            }
    
            el.appendChild(table);
        };
        
        generateStateTable(innerDiv, "Vertex State", drawInfo.state, vertexState);
        generateStateTable(innerDiv, "Fragment State", drawInfo.state, fragmentState);
        generateStateTable(innerDiv, "Depth/Stencil State", drawInfo.state, depthStencilState);
        generateStateTable(innerDiv, "Output State", drawInfo.state, outputState);
    };

    DrawInfo.prototype.captureDrawInfo = function (frame, call) {
        var gl = this.gl;

        var drawInfo = {
            args: {
                mode: 0,
                elementArrayBuffer: null,
                elementArrayType: 0,
                first: 0,
                offset: 0,
                count: 0
            },
            program: null,
            uniformInfos: [],
            attribInfos: [],
            state: null
        };

        // Args
        switch (call.name) {
            case "drawArrays":
                drawInfo.args.mode = call.args[0];
                drawInfo.args.first = call.args[1];
                drawInfo.args.count = call.args[2];
                break;
            case "drawElements":
                drawInfo.args.mode = call.args[0];
                drawInfo.args.count = call.args[1];
                drawInfo.args.elementArrayType = call.args[2];
                drawInfo.args.offset = call.args[3];
                var glelementArrayBuffer = gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING);
                drawInfo.args.elementArrayBuffer = glelementArrayBuffer ? glelementArrayBuffer.trackedObject : null;
                break;
        }

        // Program
        var glprogram = gl.getParameter(gl.CURRENT_PROGRAM);
        drawInfo.program = glprogram ? glprogram.trackedObject : null;
        if (glprogram) {
            drawInfo.uniformInfos = drawInfo.program.getUniformInfos(gl, glprogram);
            drawInfo.attribInfos = drawInfo.program.getAttribInfos(gl, glprogram);
        }

        // Capture entire state for blend mode/etc
        drawInfo.state = new gli.host.StateSnapshot(gl);

        return drawInfo;
    };

    DrawInfo.prototype.inspectDrawCall = function (frame, drawCall) {
        var doc = this.browserWindow.document;
        doc.title = "Draw Info: #" + drawCall.ordinal + " " + drawCall.name;

        var innerDiv = this.elements.innerDiv;
        innerDiv.innerHTML = "";

        // Prep canvas
        var width = frame.canvasInfo.width;
        var height = frame.canvasInfo.height;
        this.canvas.width = width;
        this.canvas.height = height;
        var gl = this.gl;

        // Prepare canvas
        frame.switchMirrors("drawinfo");
        frame.makeActive(gl, true, {
            ignoreTextureUploads: true
        });

        // Issue all calls (minus the draws we don't care about) and stop at our draw
        for (var n = 0; n < frame.calls.length; n++) {
            var call = frame.calls[n];

            if (call == drawCall) {
                // Call we want
            } else {
                // Skip other draws/etc
                switch (call.name) {
                    case "drawArrays":
                    case "drawElements":
                        continue;
                }
            }

            call.emit(gl);

            if (call == drawCall) {
                break;
            }
        }

        // Capture interesting draw info
        var drawInfo = this.captureDrawInfo(frame, drawCall);

        this.addCallInfo(frame, drawCall, drawInfo);
        this.addProgramInfo(frame, drawCall, drawInfo);
        this.addStateInfo(frame, drawCall, drawInfo);
        
        gli.ui.appendbr(innerDiv);

        // Restore all resource mirrors
        frame.switchMirrors(null);
    };

    ui.DrawInfo = DrawInfo;
})();