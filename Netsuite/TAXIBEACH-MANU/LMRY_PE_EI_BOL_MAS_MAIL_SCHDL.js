/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */

define(["N/record", "N/runtime", "N/file", "N/email", "N/encode", "N/search", "N/format", "N/log", "N/config", "N/task"],
    function(record, runtime, file, email, encode, search, format, log, config, task) {

    var user_emp   = '';
    var nameUser   = '';
    var emailUser  = '';

    var LOGRECORD_ID = 'customrecord_lmry_pe_ei_bol_mas_log';
    var LOGSEARCH_ID = 'customsearch_lmry_pe_ei_bol_mas_log';

    var cant_aceptado   = 0;
    var cant_autorizado = 0;
    var cant_rechazado  = 0;
    var cant_procesando = 0;
    var cant_error      = 0;

    var array_lote_aceptado   = new Array();
    var array_lote_autorizado = new Array();
    var array_lote_rechazado  = new Array();
    var array_lote_procesando = new Array();
    var array_lote_error      = new Array();

    var msj_resumen_status  = "";
    var msj_lote_procesando = "";
    var msj_lote_rechazado  = "";
    var msj_lote_error      = "";

    var cantidad_lotes = 0;

    var scriptObj;

    function execute(context)
    {
        try{

            log.error("INICIO", "INICIO");

            scriptObj = runtime.getCurrentScript();
            /* Obtiene empleado receptor email */
            user_emp  = scriptObj.getParameter({name: 'custscript_lmry_pe_email_emp_einvoice'});
            var param_lote  = scriptObj.getParameter({name: 'custscript_lmry_pe_mail_lote'});
log.error("param_lote", param_lote);
            recEmp = search.lookupFields({
                type   : search.Type.EMPLOYEE,
                id     : user_emp,
                columns: ['firstname', 'email'] 
            });
            nameUser  = recEmp.firstname;
            emailUser = recEmp.email;

            var fecha_actual = new Date();
                //fecha_actual = "20/7/2017";
                fecha_actual = FormatoDDMMYYY(fecha_actual);
           
            var temp=fecha_actual.split('/');
            var temp_d=parseInt(temp[0])-1;
            var fecha_ant=''+temp_d+'/'+temp[1]+'/'+temp[2];
            log.error("fecha_actual", fecha_ant);

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
                operator: search.Operator.EQUALTO ,
                values: [param_lote+'']
            });
            busqBMLog.filters = [filter_status, filter_lote];
            var initMinDoc    = 0;
            var initMaxDoc    = 100;
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
                        log.error("lote_response", lote_response);
                        if (array_doc_status != null && array_doc_status.length != 1) {
                            //log.error("array_doc_status.length", array_doc_status.length);
                            for (var k = 0; k < array_doc_status.length; k++) {
                                var doc_status_temp = array_doc_status[k];
                                var doc_status_cant_temp = doc_status_temp.split(":")[1];
                                if (doc_status_cant_temp != null && doc_status_cant_temp != '') {
                                    doc_status_cant = parseInt(doc_status_cant_temp.substring(1, doc_status_cant_temp.length));
                                    //log.error("doc_status_cant", doc_status_cant);
                                    switch(k){
                                        case 0:
                                            cant_autorizado += doc_status_cant;
                                            if (doc_status_cant != 0) {
                                                array_lote_autorizado.push(lote_txid);
                                            }
                                            break;
                                        case 1:
                                            cant_aceptado += doc_status_cant;
                                            if (doc_status_cant != 0) {
                                                array_lote_aceptado.push(lote_txid);
                                            }
                                            break;
                                        case 2:
                                            cant_rechazado += doc_status_cant;
                                            if (doc_status_cant != 0) {
                                                array_lote_rechazado.push(lote_txid);
                                            }
                                            break;
                                        case 3:
                                            cant_procesando += doc_status_cant;
                                            if (doc_status_cant != 0) {
                                                array_lote_procesando.push(lote_txid);
                                            }
                                            break;
                                        case 4:
                                            cant_error += doc_status_cant;
                                            if (doc_status_cant != 0) {
                                                array_lote_error.push(lote_txid);
                                            }
                                            break;
                                        default:
                                            break;
                                    }
                                }
                            }
                        }
                    }

                    log.error("lote_cantidad - lote_txid", lote_cantidad + " - " + lote_txid);
                    msj_resumen_status = "Autorizados: " + cant_autorizado + " | Aceptados: " + cant_aceptado + " | Rechazados: " + cant_rechazado + " | Procesando: " + cant_procesando + " | Error: " + cant_error;
                    log.error("cant_autorizado - cant_aceptado - cant_rechazado - cant_procesando - cant_error", msj_resumen_status);
                    //log.error("cant_autorizado - cant_aceptado - cant_rechazado - cant_procesando - cant_error", cant_autorizado + " - " + cant_aceptado + " - " + cant_rechazado + " - " + cant_procesando + " - " + cant_error);
                    
                    //log.error("Remaining governance units: " + scriptObj.getRemainingUsage());
                }
                msj_lote_procesando = "Lotes Procesando: ";
                log.error("array_lote_procesando.length", array_lote_procesando.length);
                if(array_lote_procesando.length == 0){
                    msj_lote_procesando += "Ninguno";
                }
                for (var i = 0; i < array_lote_procesando.length; i++) {
                    if (i == 0) {
                        msj_lote_procesando += array_lote_procesando[i];
                    }else{
                        msj_lote_procesando += ", " + array_lote_procesando[i];
                    }
                }
                log.error("msj_lote_procesando", msj_lote_procesando);

                msj_lote_rechazado = "Lotes Rechazado: ";
                log.error("array_lote_rechazado.length", array_lote_rechazado.length);
                if(array_lote_rechazado.length == 0){
                    msj_lote_rechazado += "Ninguno";
                }
                for (var i = 0; i < array_lote_rechazado.length; i++) {
                    if (i == 0) {
                        msj_lote_rechazado += array_lote_rechazado[i];
                    }else{
                        msj_lote_rechazado += ", " + array_lote_rechazado[i];
                    }
                }
                log.error("msj_lote_rechazado", msj_lote_rechazado);

                msj_lote_error = "Lotes Error: ";
                log.error("array_lote_error.length", array_lote_error.length);
                if(array_lote_error.length == 0){
                    msj_lote_error += "Ninguno";
                }
                for (var i = 0; i < array_lote_error.length; i++) {
                    if (i == 0) {
                        msj_lote_error += array_lote_error[i];
                    }else{
                        msj_lote_error += ", " + array_lote_error[i];
                    }
                }
                log.error("msj_lote_error", msj_lote_error);

                log.error("resultbusqBMLog.length", resultbusqBMLog.length);
                
                if(resultbusqBMLog.length == initMaxDoc){
                    initMinDoc = initMinDoc + initMaxDoc;
                    initMaxDoc = initMaxDoc + initMaxDoc;
                    resultbusqBMLog = objbusqBMLog.getResults(initMinDoc, initMaxDoc);
                }else{
                    busqStop = true;
                }
                //busqStop = true;
            }

            log.error("Remaining governance units: " + scriptObj.getRemainingUsage());
            sendMail("", "", "", "", "", "", "", "");

            log.error("FIN", "FIN");

        }catch(e){
            log.error("Catch", e.valueOf().toString());
            
            log.error("Remaining governance units: " + scriptObj.getRemainingUsage());
        }

    }

    function sendMail(content, WSIniSesion, WSUltimoNroCbte, WSAutCbtsSinc, WSSalidaTransac, WSRespCbte, WSDescargarPdf, PDF){

        var currentuserM = runtime.getCurrentUser().id;
        var emailUserM   = runtime.getCurrentUser().email;
        log.error('currentuserM',currentuserM);

        var recEmpM = search.lookupFields({
            type: search.Type.EMPLOYEE,
            id: currentuserM,
            columns: 'firstname'
        });
        var nameUserM    = recEmpM.firstname;

        log.error("nameUser - emailUser", nameUserM + " - " + emailUserM+"-"+emailUser);

        var body =  '<body text="#333333" link="#014684" vlink="#014684" alink="#014684">';
            body += '<table width="642" border="0" align="center" cellpadding="0" cellspacing="0">';
            body += '<tr>';
            body += '<td width="100%" valign="top">';
            body += '<table width="100%" border="0" align="center" cellpadding="0" cellspacing="0">';
            body += '<tr>';
            body += '<td width="100%" colspan="2"><img style="display: block;" src="https://system.na1.netsuite.com/core/media/media.nl?id=921&c=TSTDRV1038915&h=c493217843d184e7f054" width="645" alt="main banner"/></td>';
            body += '</tr>';
            body += '</table>';
            body += '<table width="100%" border="0" align="center" cellpadding="0" cellspacing="0">';
            body += '<tr>';
            body += '<td bgcolor="#d50303" width="15%">&nbsp;</td>';
            body += '<td bgcolor="#d50303" width="85%">';
            body += '<font style="color:#FFFFFF; line-height:130%; font-family:Arial, Helvetica, sans-serif; font-size:19px">';
            body += 'Estimado(a) :<br>';
            body += '</font>';
            body += '</td>';
            body += '</tr>';
            body += '<tr>';
            body += '<td width="100%" bgcolor="#d50303" colspan="2" align="right"><a href="http://www.latamready.com/#contac"><img src="https://system.na1.netsuite.com/core/media/media.nl?id=923&c=TSTDRV1038915&h=3c7406d759735a1e791d" width="94" style="margin-right:45px" /></a></td>';
            body += '</tr>';
            body += '<tr>';
            body += '<td width="100%" bgcolor="#FFF" colspan="2" align="right">';
            body += '<a href="https://www.linkedin.com/company/9207808"><img src="https://system.na1.netsuite.com/core/media/media.nl?id=924&c=TSTDRV1038915&h=c135e74bcb8d5e1ac356" width="15" style="margin:5px 1px 5px 0px" /></a>';
            body += '<a href="https://www.facebook.com/LatamReady-337412836443120/"><img src="https://system.na1.netsuite.com/core/media/media.nl?id=919&c=TSTDRV1038915&h=9c937774d04fb76747f7" width="15" style="margin:5px 1px 5px 0px" /></a>';
            body += '<a href="https://twitter.com/LatamReady"><img src="https://system.na1.netsuite.com/core/media/media.nl?id=928&c=TSTDRV1038915&h=fc69b39a8e7210c65984" width="15" style="margin:5px 47px 5px 0px" /></a>';
            body += '</td>';
            body += '</tr>';
            body += '</table>';
            body += '<table width="100%" border="0" cellspacing="0" cellpadding="2">';
            body += '<tr>';
            body += '<td width="15%">&nbsp;</td>';
            body += '<td width="70%">';
            body += '<font style="color:#333333;line-height:200%; font-family:Trebuchet MS, Helvetica, sans-serif; font-size:13px">';
            body += '<p>Este es un mensaje automático de LatamReady SuiteApp.</p>';
            body += '<p>Se ha generado lotes masivos de boletas electrónicas. El resumen de estado de los lotes enviados es el siguiente:</p>';
            body += '<p>Cantidad de Lotes Generados: ' + cantidad_lotes + '</p>';
            body += '<p>Cantidad de Documentos por Estado:</p>';
            body += '<p>' + msj_resumen_status + '</p>';
            body += '<p>' + msj_lote_procesando + '</p>';
            body += '<p>' + msj_lote_rechazado + '</p>';
            body += '<p>' + msj_lote_error + '</p>';
            body += '<p>Los demás lotes (si es que los hay) fueron Aceptados/Autorizados.</p>';
            body += '<p>Saludos,</p>';
            body += '<p>El Equipo de LatamReady</p>';
            body += '</font>';
            body += '</td>';
            body += '<td width="15%">&nbsp;</td>';
            body += '</tr>';
            body += '</table>';
            body += '<br>';
            body += '<table width="100%" border="0" cellspacing="0" cellpadding="2" bgcolor="#e5e6e7">';
            body += '<tr>';
            body += '<td>&nbsp;</td>';
            body += '</tr>';
            body += '<tr>';
            body += '<td width="15%">&nbsp;</td>';
            body += '<td width="70%" align="center">';
            body += '<font style="color:#333333;line-height:200%; font-family:Trebuchet MS, Helvetica, sans-serif; font-size:12px;" >';
            body += '<i>Este es un mensaje automático. Por favor, no responda este correo electrónico.</i>';
            body += '</font>';
            body += '</td>';
            body += '<td width="15%">&nbsp;</td>';
            body += '</tr>';
            body += '<tr>';
            body += '<td>&nbsp;</td>';
            body += '</tr>';
            body += '</table>';
            body += '<table width="100%" border="0" cellspacing="0" cellpadding="2">';
            body += '<tr>';
            body += '<td width="15%">&nbsp;</td>';
            body += '<td width="70%" align="center">';
            body += '<a href="http://www.latamready.com/"><img src="https://system.na1.netsuite.com/core/media/media.nl?id=926&c=TSTDRV1038915&h=e14f0c301f279780eb38" width="169" style="margin:15px 0px 15px 0px" /></a>';
            body += '</td>';
            body += '<td width="15%">&nbsp;</td>';
            body += '</tr>';
            body += '</table>';
            body += '<table width="100%" border="0" cellspacing="0" cellpadding="2">';
            body += '<tr>';
            body += '<td width="15%">&nbsp;</td>';
            body += '<td width="70%" align="center">';
            body += '<a href="https://www.linkedin.com/company/9207808"><img src="https://system.na1.netsuite.com/core/media/media.nl?id=925&c=TSTDRV1038915&h=41ec53b63dba135488be" width="101" style="margin:0px 5px 0px 5px" /></a>';
            body += '<a href="https://www.facebook.com/LatamReady-337412836443120/"><img src="https://system.na1.netsuite.com/core/media/media.nl?id=920&c=TSTDRV1038915&h=7fb4d03fff9283e55318" width="101" style="margin:0px 5px 0px 5px" /></a>';
            body += '<a href="https://twitter.com/LatamReady"><img src="https://system.na1.netsuite.com/core/media/media.nl?id=929&c=TSTDRV1038915&h=300c376863035d25c42a" width="101" style="margin:0px 5px 0px 5px" /></a>';
            body += '</td>';
            body += '<td width="15%">&nbsp;</td>';
            body += '</tr>';
            body += '</table>';
            body += '<table width="100%" border="0" cellspacing="0">';
            body += '<tr>';
            body += '<td>';
            body += '<img src="https://system.na1.netsuite.com/core/media/media.nl?id=918&c=TSTDRV1038915&h=7f0198f888bdbb495497" width="642" style="margin:15px 0px 15px 0px" /></a>';
            body += '</td>';
            body += '</tr>';
            body += '</table>';
            body += '</td>';
            body += '</tr>';
            body += '</table>';
            body += '</body>';

        var subject = '';
            subject = "LatamReady - PE Boleteo Masivo : Resumen de Generación";

        email.send({
            author: user_emp,
            recipients: emailUser,
            //cc: emailUserM,
            subject: subject,
            body: body
        });

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

    return {
        execute: execute
    };

});