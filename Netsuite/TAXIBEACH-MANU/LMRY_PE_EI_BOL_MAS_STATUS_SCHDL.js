/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */

define(["N/record", "N/runtime", "N/file", "N/email", "N/encode", "N/search", "N/format", "N/log", "N/config", "N/task"],
    function(record, runtime, file, email, encode, search, format, log, config, task) {

    var URL_WS      = '';
    var USER        = '';
    var PASSWORD    = '';
    var UBIGEO      = '';
    var HOST_WS     = '';
    var AMBIENTE_WS = '';
    var FORMATO_WS  = '';

    var SesionId         = '';
    var FechaVencimiento = '';
    var cuitId           = '';

    var TransaccionId    = '';

    var exito         = false;
    var mensajeError  = '';
    var status_doc    = '';

    var user_emp  = '';
    var nameUser  = '';
    var emailUser = '';

    var LOGRECORD_ID = 'customrecord_lmry_pe_ei_bol_mas_log';
    var LOGSEARCH_ID = 'customsearch_lmry_pe_ei_bol_mas_log';
    var DOCRECORD_ID = 'customrecord_lmry_pe_ei_boleteo_masivo';
    var DOCSEARCH_ID = 'customsearch_lmry_pe_ei_bol_mas_docs';
    var id_BMlog     = '';


    var cant_aceptado   = 0;
    var cant_autorizado = 0;
    var cant_rechazado  = 0;
    var cant_procesando = 0;
    var cant_error      = 0;

    var array_lote_id_proceso = new Array();
    var array_lote_txid_proce = new Array();
    var array_lote_cantidad   = new Array();

    var msjResponseLog = '';
    var scriptObj;
var param_lote='';
    var arrayMainID;
    var cantidadTx = 0;

    function execute(context)
    {
        try{

            log.error("INICIO", "INICIO");

            scriptObj = runtime.getCurrentScript();
            param_lote  = scriptObj.getParameter({name: 'custscript_lmry_pe_status_lote'});
          log.error('param_lote',param_lote);
            getEnableFeatures();

            var subsi = runtime.isFeatureInEffect({feature: "SUBSIDIARIES"});
            var subsidiary  = null;
            if (subsi) {
                /* Falta lógica para OneWorld !!!!!!!!!!!!! */
                param_subsidiary  = scriptObj.getParameter({name: 'custscript_lmry_pe_ei_subsidiary'});
                log.error("subsidiary", param_subsidiary);
                subsidiary = record.load({type: record.Type.SUBSIDIARY, id: param_subsidiary});
            }else{
                subsidiary = config.load({type: config.Type.COMPANY_INFORMATION});
            }
            var subsi_numdoc   = subsidiary.getValue('employerid');
            cuitId             = subsi_numdoc;

            /* Obtiene empleado receptor email */
            user_emp  = scriptObj.getParameter({name: 'custscript_lmry_pe_email_emp_einvoice'});

            recEmp = search.lookupFields({
                type   : search.Type.EMPLOYEE,
                id     : user_emp,
                columns: ['firstname', 'email'] 
            });
            nameUser  = recEmp.firstname;
            emailUser = recEmp.email;

            var fecha_actual = new Date();
                fecha_actual = FormatoDDMMYYY(fecha_actual);
            //log.error("fecha_actual", fecha_actual);

            /* Búsqueda Personalizada LatamReady - PE EI Boleteo Masivo Docs */ 
            busqBMLog = search.load({
                id: LOGSEARCH_ID
            });
            filter_status = search.createFilter({
                name: 'custrecord_lmry_pe_ei_bm_status',
                operator: search.Operator.CONTAINS,
                values: ["Enviado"]
            });

            filter_lote = search.createFilter({
                name: 'custrecord_lmry_pe_ei_ejecu',
                operator: search.Operator.EQUALTO,
                values: [param_lote+'']
            });
           // filter_date = search.createFilter({
            //    name: 'created',
            //    operator: search.Operator.ON,
                //values: [fecha_actual]
            //    values: ["26/9/2017"]
            //});
            busqBMLog.filters = [filter_status,filter_lote];
            var initMinDoc    = 0;
            var initMaxDoc    = 1000;
            objbusqBMLog      = busqBMLog.run();
            resultbusqBMLog   = objbusqBMLog.getRange(initMinDoc, initMaxDoc);
            cantidad_lotes    = resultbusqBMLog.length;
            log.error("cantidad_lotes", cantidad_lotes);

            var busqStop      = false;
            var superaMemoria = false;

            while(!busqStop){
                for ( var i = 0; resultbusqBMLog != null && i < resultbusqBMLog.length; i++){
                    row  = resultbusqBMLog[i].columns;
                    //log.error("row", row);
                    var lote_id = resultbusqBMLog[i].id;

                    var lote_cantidad = resultbusqBMLog[i].getValue(row[3]);
                    var lote_status   = resultbusqBMLog[i].getValue(row[4]);
                    var lote_response = resultbusqBMLog[i].getValue(row[5]);

                    var lote_txid = "";
                    if (lote_status != null && lote_status != '') {
                        var lote_txid_temp = lote_status.split(" - ")[1];
                        if (lote_txid_temp != null && lote_txid_temp != '') {
                            lote_txid = lote_txid_temp;
                        }
                    }
                    var doc_status_cant;
                    if (lote_response != null && lote_response != '') {
                        var array_doc_status = lote_response.split(" | ");
                        //log.error("lote_response", lote_response);
                        if (array_doc_status != null && array_doc_status.length != 1) {
                            var doc_status_temp = array_doc_status[3];
                            var doc_status_cant_temp = doc_status_temp.split(":")[1];
                            if (doc_status_cant_temp != null && doc_status_cant_temp != '') {
                                doc_status_cant = parseInt(doc_status_cant_temp.substring(1, doc_status_cant_temp.length));
                                //log.error("lote_txid - doc_status_cant", lote_txid + " - " + doc_status_cant);
                                if (doc_status_cant != 0) {
                                    //log.error("lote_id", lote_id);
                                    array_lote_id_proceso.push(lote_id);
                                    array_lote_txid_proce.push(lote_txid);
                                    array_lote_cantidad.push(lote_cantidad);
                                }
                            }
                        }
                    }
                    //log.error("Remaining governance units: " + scriptObj.getRemainingUsage());
                }
                busqStop = true;
            }

           // log.error("Array Lote ID length", array_lote_id_proceso.length);
           // log.error("Array TransaccionId length", array_lote_txid_proce.length);
           // log.error("Array Cantidad Lote length", array_lote_cantidad.length);
            for (var i = 0; i < array_lote_txid_proce.length; i++) {
              log.error("Remaining governance units 1.5: " + scriptObj.getRemainingUsage());
                if(scriptObj.getRemainingUsage() < 2000){
                        superaMemoria = true;
                        log.error("Supera Memoria 1",superaMemoria);
                        break;
                }
                id_BMlog = array_lote_id_proceso[i];
                //log.error("Lote["+i+"]", id_BMlog);
                TransaccionId = array_lote_txid_proce[i];
                //log.error("TransaccionId["+i+"]", TransaccionId);
                cantidadTx = array_lote_cantidad[i];
                //log.error("cantidadTx["+i+"]", cantidadTx);

                returnIniSesion = WSIniSesion();
                if (returnIniSesion == 'Error') {
                    mailResumen();
                    return true;
                }

                /* Búsqueda Personalizada LatamReady - PE EI Boleteo Masivo Docs */ 
                busqBolMas = search.load({
                    id: DOCSEARCH_ID
                });
                filter_txid = search.createFilter({
                    name: 'custrecord_lmry_pe_ei_id',
                    operator: search.Operator.IS,
                    values: [TransaccionId],
                    //values: [397]
                });
                busqBolMas.filters = [filter_txid];
                initMinDoc = 0;
                initMaxDoc = 1000;
                objbusqBolMas    = busqBolMas.run();
                resultbusqBolMas = objbusqBolMas.getRange(initMinDoc, initMaxDoc);
                //log.error("resultbusqBolMas.length", resultbusqBolMas.length);
                arrayMainID = new Array();
                for ( var k = 0; resultbusqBolMas != null && k < resultbusqBolMas.length; k++){
                    main_id = resultbusqBolMas[k].id;
                    arrayMainID.push(main_id);
                }  
                //log.error("arrayMainID.length", arrayMainID.length);

                cant_aceptado   = 0;
                cant_autorizado = 0;
                cant_rechazado  = 0;
                cant_procesando = 0;
                cant_error      = 0;

                if (arrayMainID.length != 0) {
                    returnSalidaTransac = WSSalidaTransac();
                    if (returnSalidaTransac == 'Error') {
                        mailResumen();
                        return true;
                    }
                    msjResponseLog = "Autorizados: " + cant_autorizado + " | Aceptados: " + cant_aceptado + " | Rechazados: " + cant_rechazado + " | Procesando: " + cant_procesando + " | Error: " + cant_error;

                    log.error("msjResponseLog", msjResponseLog);
                    log.error("Remaining governance units 2: " + scriptObj.getRemainingUsage());
                    record.submitFields({
                        type  : LOGRECORD_ID,
                        id    : id_BMlog,
                        values: {custrecord_lmry_pe_ei_bm_status: 'Enviado - ' + TransaccionId, custrecord_lmry_pe_ei_bm_response: msjResponseLog}
                    });
                }
              
            }
            
            if(superaMemoria){ 
                 var params = {};

                params['custscript_lmry_pe_status_lote'] = param_lote;
                
                var schdl_task = task.create({
                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                    scriptId: "customscript_lmry_pe_ei_bm_status_schdl",
                    deploymentId: "customdeploy_lmry_pe_ei_bm_status_schdl",
                    params: params
                });
                schdl_task.submit();
            }else{
                mailResumen();
            }

            log.error("FIN", "FIN");

        }catch(e){
            log.error("Catch", e.valueOf().toString());
            
            log.error("Remaining governance units: " + scriptObj.getRemainingUsage());
        }
    }

    function WSIniSesion(){

        var StringXML = 
            '<?xml version="1.0" encoding="utf-8"?>'+
            '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'+
            '<soap:Body>'+
            '<IniciarSesion xmlns="http://comfiar.com.ar/webservice/">'+
            '   <usuarioId>'+USER+'</usuarioId>'+
            '   <password>'+PASSWORD+'</password>'+
            '</IniciarSesion>'+
            '</soap:Body>'+
            '</soap:Envelope>';

        var soapHeaders = new Array();
            soapHeaders['Host'] = HOST_WS;
            soapHeaders['Content-Type'] = 'text/xml; charset=utf-8'; 
            soapHeaders['Content-Length'] = 'length';
            soapHeaders['SOAPAction'] = "http://comfiar.com.ar/webservice/IniciarSesion";

        var objIniSesion = '';

        try{
            if (AMBIENTE_WS == '1') {
                require(['N/http'], function(http) {
                    objIniSesion    =
                        http.post({
                            url: URL_WS,
                            body: StringXML,
                            headers: soapHeaders
                        });
                });
            }else if(AMBIENTE_WS == '2'){
                require(['N/https'], function(https) {
                    objIniSesion    =
                        https.post({
                            url: URL_WS,
                            body: StringXML,
                            headers: soapHeaders
                        });
                });
            }
        }catch(e){
            log.error('CATCH ERROR WSIniSesion', e);
            var msjCatch = e.valueOf().toString().substring(0,300);
            log.error('CATCH ERROR WSIniSesion MSJCATCH', msjCatch);
            record.submitFields({
                type  : LOGRECORD_ID,
                id    : id_BMlog,
                values: {custrecord_lmry_pe_ei_bm_status: 'Error - ' + TransaccionId, custrecord_lmry_pe_ei_bm_response: "Error Inesperado al iniciar sesión"}
            });
            return 'Error';
        }

        var returnIniSesion = objIniSesion.body;
            returnIniSesion = replaceXML(returnIniSesion);

        var sesion = returnIniSesion.split('SesionId')[1];
        if(sesion != null && sesion != ''){
            SesionId = sesion.substring(1, sesion.length-2);
            FechaVencimiento = returnIniSesion.split('FechaVencimiento')[1];
            FechaVencimiento = FechaVencimiento.substring(1, FechaVencimiento.length-2);
        }

        return returnIniSesion;
    }

    function WSSalidaTransac(){
        log.error("WSSalidaTransac", "Inicio WSSalidaTransac");

        var StringXML = 
            '<?xml version="1.0" encoding="utf-8"?>'+
            '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'+
              '<soap:Body>'+
                '<SalidaTransaccion xmlns="http://comfiar.com.ar/webservice/">'+
                  '<cuitId>'+cuitId+'</cuitId>'+
                  '<transaccionId>'+TransaccionId+'</transaccionId>'+
                  '<token>'+
                    '<SesionId>'+SesionId+'</SesionId>'+
                    '<FechaVencimiento>'+FechaVencimiento+'</FechaVencimiento>'+
                  '</token>'+
                '</SalidaTransaccion>'+
              '</soap:Body>'+
            '</soap:Envelope>'; 

        var soapHeaders = new Array(); 
            soapHeaders['Host'] = HOST_WS;
            soapHeaders['Content-Type'] = 'text/xml; charset=utf-8'; 
            soapHeaders['Content-Length'] = 'length';
            soapHeaders['SOAPAction'] = "http://comfiar.com.ar/webservice/SalidaTransaccion";
            
        var objSalidaTransac = '';
        try{
            if (AMBIENTE_WS == '1') {
                require(['N/http'], function(http) {
                    objSalidaTransac    =
                        http.post({
                            url: URL_WS,
                            body: StringXML,
                            headers: soapHeaders
                        });
                });
            }else if(AMBIENTE_WS == '2'){
                require(['N/https'], function(https) {
                    objSalidaTransac    =
                        https.post({
                            url: URL_WS,
                            body: StringXML,
                            headers: soapHeaders
                        });
                });
            }
        }catch(e){
            log.error('CATCH ERROR WSSalidaTransac', e);
            var msjCatch = e.valueOf().toString().substring(0,300);
            log.error('CATCH ERROR WSSalidaTransac MSJCATCH', msjCatch);
            record.submitFields({
                type  : LOGRECORD_ID,
                id    : id_BMlog,
                values: {custrecord_lmry_pe_ei_bm_status: 'Error - ' + TransaccionId, custrecord_lmry_pe_ei_bm_response: "Error Inesperado al consumir WS Salida de Transacción"}
            });
            return 'Error';
        }

        mensajeError = "";
        exito        = false;

        var returnSalidaTransac = objSalidaTransac.body;
            returnSalidaTransac = replaceXML(returnSalidaTransac);

        var estadoProceso = returnSalidaTransac.split('TransaccionSinTerminar>')[1];
        var error         = returnSalidaTransac.split('TransaccionError>')[1];
        var infoComfiar   = returnSalidaTransac.split('informacionComfiar>');

        if(estadoProceso != null && estadoProceso != ''){
            exito = true;
            status_doc = "Procesando";

            estadoProceso = estadoProceso.split('Estado>')[1];
            estadoProceso = estadoProceso.substring(0, estadoProceso.length-2);

            for (var i = 0; i < arrayMainID.length; i++) {
                logError(arrayMainID[i], status_doc, mensajeError);
            }
            //cant_procesando++;
            cant_procesando = cantidadTx;
        }else if (error != null && error != '') {
            error = error.split('Error>')[1];
            error = error.substring(0, error.length-2);
            status_doc   = "ERROR";
            mensajeError = error;
            for (var i = 0; i < arrayMainID.length; i++) {
                logError(arrayMainID[i], status_doc, mensajeError);
            }
            //cant_error++;
            cant_error = cantidadTx;
        }else if(infoComfiar != null && infoComfiar.length != 1){
            main_id_cont = 0;
            for (var j = 1; j < infoComfiar.length; j=j+2) {
                mensajeError = "";
                infoComfiar_temp = infoComfiar[j];
                estado = infoComfiar_temp.split('Estado>')[1];
                estado = estado.substring(0, estado.length-2);
                //log.error("******doc_internalid******", arrayMainID[main_id_cont]);
               // log.error("doc_estado", estado);
                if (estado == 'ACEPTADO' || estado == 'AUTORIZADO') {
                    exito = true;
                    status_doc = estado;

                    if (estado == 'ACEPTADO') {
                        cant_aceptado++;
                    }else{
                        cant_autorizado++;
                    }

                }else{
                    exito      = false;
                    if (estado == "ERROR") {
                        estado = "RECHAZADO";
                    }
                    status_doc = estado;
                    array_mensaje  = infoComfiar_temp.split('mensaje>');
                    var mensaje    = "";
                    var mensaje_id = "";
                    if (array_mensaje != null && array_mensaje.length != 1) {
                        var n = 1;
                        for (var m = 2; m < array_mensaje.length; m=m+4) {
                            mensaje = array_mensaje[m];
                            mensaje = mensaje.substring(0, mensaje.length - 2);
                            mensaje_id = infoComfiar_temp.split('identificador>')[n];
                            mensaje_id = mensaje_id.substring(0, mensaje_id.length - 2);

                            n = n + 2;

                            //log.error("mensaje_id", mensaje_id);
                            //log.error("mensaje", mensaje);
                            
                            mensajeError += "ID Error: " + mensaje_id + " - " + mensaje + "\n";
                        }

                        log.error("mensajeError", mensajeError);
                    }

                    cant_rechazado++;
                }
                logError(arrayMainID[main_id_cont], status_doc, mensajeError);
                main_id_cont++;
            }
            log.error("main_id_cont", main_id_cont);
        }
        log.error("status_doc - mensajeError", status_doc + " - " + mensajeError);

        return returnSalidaTransac;
    }

    function logError(main_id, status_doc, resp){

       // log.error("exito - status_doc - resp", exito + " - " + status_doc + " - " + resp);

        var params = {};

        params['custrecord_lmry_pe_ei_status'] = status_doc;
        if (exito) {
            params['custrecord_lmry_pe_ei_response'] = "";
        }else{
            params['custrecord_lmry_pe_ei_response'] = resp;
        }
        record.submitFields({
            type  : DOCRECORD_ID,
            id    : main_id,
            values: params
        });
    }

    function mailResumen(){

        var params = {};

                params['custscript_lmry_pe_mail_lote'] = param_lote;

        var schdl_task = task.create({
            taskType: task.TaskType.SCHEDULED_SCRIPT,
            scriptId: "customscript_lmry_pe_ei_bm_mail_schdl",
            deploymentId: "customdeploy_lmry_pe_ei_bm_mail_schdl",
            params: params
        });
        schdl_task.submit();

        log.error("task_status", schdl_task);
    }

    function getEnableFeatures(){

        /* Registro Personalizado LatamReady - PE Enable Feature FEL */
        
        busqEnabFet = search.create({
            type: 'customrecord_lmry_pe_fel_enable_feature',
            columns: ['custrecord_lmry_pe_fel_usuario_ws', 'custrecord_lmry_pe_fel_password_ws', 
                        'custrecord_lmry_pe_fel_url_acceso_ws', 'custrecord_lmry_pe_fel_host_ws',
                        'custrecord_lmry_pe_formatoid_ws', 'custrecord_lmry_pe_ubigeo',
                        'custrecord_lmry_pe_ambiente_ws']
        });
        resultEnabFet = busqEnabFet.run().getRange(0, 10);
        
        if(resultEnabFet != null && resultEnabFet.length != 0){
            row  = resultEnabFet[0].columns;
            USER        = resultEnabFet[0].getValue(row[0]);
            PASSWORD    = resultEnabFet[0].getValue(row[1]);
            URL_WS      = resultEnabFet[0].getValue(row[2]);
            HOST_WS     = resultEnabFet[0].getValue(row[3]);
            FORMATO_WS  = resultEnabFet[0].getValue(row[4]);
            UBIGEO      = resultEnabFet[0].getValue(row[5]);
            AMBIENTE_WS = resultEnabFet[0].getValue(row[6]);
        }
    }

    function FormatoDDMMYYY(fecha){
        var f = format.parse({
            value: fecha,
            type: format.Type.DATE
        });
        var d = f.getDate();
        var m = f.getMonth()+1;
        var y = f.getFullYear();
        m = m + '';
        if (m.length == 1) {
            m = '0' + m;
        }
        d = d + '';
        if (d.length == 1) {
            d = '0' + d;
        }

        var fechaOrden = d+'/'+m+'/'+y;

        return fechaOrden;
    }

    function replaceXML(xml){
        xml = xml.replace(/&lt;/g, '<');
        xml = xml.replace(/&gt;/g, '>');
        xml = xml.replace(/&amp;lt;/g, '<');
        xml = xml.replace(/&amp;gt;/g, '>');

        return xml;
    }

    return {
        execute: execute
    };

});