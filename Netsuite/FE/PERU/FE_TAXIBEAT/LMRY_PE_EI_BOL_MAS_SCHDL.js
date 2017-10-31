/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */

define(["N/record", "N/runtime", "N/file", "N/email", "N/encode", "N/search", "N/format", "N/log", "N/config", "N/task"],
    function(record, runtime, file, EMAIL, encode, search, format, log, config, task) {

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
    var puntoDeVentaIdWS = '';
    var nroCbte          = '';
    var secuencial       = '';

    var codDoc           = '';
    var TransaccionId    = '';
    var PDF              = '';
    var internalId       = '';
    var tranID           = '';

    var xmlEnvio     = "";
    var xmlMostrar   = "";

    var exito         = false;
    var mensajeError  = '';
    var status_doc    = '';
    var nameTypeDoc   = '';
    var serie         = '';
    var user_emp      = '';

    var user_emp   = '';
    var nameUser   = '';
    var emailUser  = '';
    var estado_comfiar   = '';

    var LOGRECORD_ID = 'customrecord_lmry_pe_ei_bol_mas_log';
    var DOCSEARCH_ID = 'customsearch_lmry_pe_ei_bol_mas_docs';
    var DOCRECORD_ID = 'customrecord_lmry_pe_ei_boleteo_masivo';
    var id_BMlog     = '';


    var cant_aceptado   = 0;
    var cant_autorizado = 0;
    var cant_rechazado  = 0;
    var cant_procesando = 0;
    var cant_error      = 0;

    var cantidadTx     = 0;
    var arrayMainID    = new Array();
    var main_id        = '';
    var msjResponseLog = '';

    var nroCbte_init   = '';
    var scriptObj;

    var array_nrCbte = new Array();

    var fileXML = new Array();

    var error_log = false;

    function execute(context)
    {
        try{

            log.error("INICIO", "INICIO");
            //return true;
            getEnableFeatures();

            var subsi = runtime.isFeatureInEffect({feature: "SUBSIDIARIES"});

            scriptObj = runtime.getCurrentScript();
            param_date_from  = scriptObj.getParameter({name: 'custscript_lmry_pe_ei_date_from'});
            param_date_to    = scriptObj.getParameter({name: 'custscript_lmry_pe_ei_date_to'});
            param_serie      = scriptObj.getParameter({name: 'custscript_lmry_pe_ei_serie'});
            var subsidiary   = null;
            var subsi_numdoc = "";
            if (subsi) {
                param_subsidiary  = scriptObj.getParameter({name: 'custscript_lmry_pe_ei_subsidiary'});
                log.error("subsidiary", param_subsidiary);
                subsidiary = record.load({type: record.Type.SUBSIDIARY, id: param_subsidiary});
                subsi_numdoc   = subsidiary.getValue('federalidnumber');
            }else{
                subsidiary = config.load({type: config.Type.COMPANY_INFORMATION});
                subsi_numdoc   = subsidiary.getValue('employerid');
            }
            cuitId             = subsi_numdoc;
            var subsi_typeDoc  = subsidiary.getValue('custrecord_tipo_doc_id_sunat_id');
            var subsi_cmpyname = subsidiary.getValue('legalname');
            var subsi_state    = subsidiary.getValue('state');
            log.error("subsi_numdoc - subsi_typeDoc - subsi_cmpyname - subsi_state", subsi_numdoc + " - " + subsi_typeDoc + " - " + subsi_cmpyname + " - " + subsi_state);
            log.error("param_date_from - param_date_to - param_serie", param_date_from + " - " + param_date_to + " - " + param_serie);

            recordBMlog = record.create({type: LOGRECORD_ID});
            recordBMlog.setValue('custrecord_lmry_pe_ei_bm_subsidiary', runtime.getCurrentUser().subsidiary);
            recordBMlog.setValue('custrecord_lmry_pe_ei_bm_user', runtime.getCurrentUser().id);
            recordBMlog.setValue('custrecord_lmry_pe_ei_bm_status', "Procesando");
            id_BMlog = recordBMlog.save();

            //var returnIniSesion = WSIniSesion();
            returnIniSesion = WSIniSesion();
            if (returnIniSesion == 'Error') {
                mailResumen();
                return true;
            }
            /* Automatizar para demás comprobantes. Ahora esta hardcode solo para Boletas */
            //cuitId = "20556406881";
            /* Registro Personalizado LatamReady - PE Puntos Ventas WS
                var serie  = resultPtoVta[i].getValue(row[0]);
                var ptoVta = resultPtoVta[i].getValue(row[1]);
            */
            recSerie = search.lookupFields({
                type   : 'customrecord_lmry_serie_impresion_cxc',
                id     : param_serie,
                columns: ['name'] 
            });
            log.error("serie", recSerie.name);
            busqPtoVta = search.create({
                type: 'customrecord_lmry_pe_pto_vta_ws',
                columns: ['custrecord_lmry_pe_pto_vta'],
                filters: [ ['custrecord_lmry_pe_serie_cxc', 'is', recSerie.name] ]
            });
            resultPtoVta = busqPtoVta.run().getRange(0, 30);
            if(resultPtoVta != null && resultPtoVta.length != 0){
                row  = resultPtoVta[0].columns;
                puntoDeVentaIdWS = resultPtoVta[0].getValue(row[0]);
            }
            log.error("puntoDeVentaIdWS", puntoDeVentaIdWS);
            codDoc = '03';
            //puntoDeVentaIdWS = '1001';
            var returnUltimoNroCbte = WSUltimoNroCbte();
            if (returnUltimoNroCbte == 'Error') {
                mailResumen();
                return true;
            }
            log.error("nroCbte", nroCbte);

            /* Búsqueda Personalizada LatamReady - PE EI Boleteo Masivo Docs */ 
            busqBolMas = search.load({
                id: DOCSEARCH_ID
            });
            filter_date_from = search.createFilter({
                name: 'custrecord_lmry_pe_ei_date',
                operator: search.Operator.ONORAFTER,
                values: [param_date_from]
            });
            filter_date_to = search.createFilter({
                name: 'custrecord_lmry_pe_ei_date',
                operator: search.Operator.ONORBEFORE,
                values: [param_date_to]
            });
            filter_status = search.createFilter({
                name: 'custrecord_lmry_pe_ei_status',
                operator: search.Operator.ISNOT,
                values: ["AUTORIZADO"]
            });
            filter_status2 = search.createFilter({
                name: 'custrecord_lmry_pe_ei_status',
                operator: search.Operator.ISNOT,
                values: ["Procesando"]
            });
            filter_serie = search.createFilter({
                name: 'custrecord_lmry_pe_ei_point_sale',
                operator: search.Operator.ANYOF,
                values: param_serie
            });
            busqBolMas.filters = [filter_date_from, filter_date_to, filter_status, filter_status2, filter_serie];
            if (subsi) {
                filter_subsi = search.createFilter({
                    name: 'custrecord_lmry_pe_ei_subsidiary',
                    operator: search.Operator.ANYOF,
                    values: param_subsidiary
                });
                busqBolMas.filters.push(filter_subsi);
            }
            var initMinDoc = 0;
            var initMaxDoc = 500;
            objbuqBolMas   = busqBolMas.run();
            resultBolMas   = objbuqBolMas.getRange(initMinDoc, initMaxDoc);
            //log.error("resultBolMas", resultBolMas);
            log.error("resultBolMas.length", resultBolMas.length);
            //cantidadTx = resultBolMas.length;

            var busqStop      = false;
            var superaMemoria = false;

            xmlEnvio = ''+
                '<?xml version="1.0" encoding="ISO-8859-1" standalone="no"?>\n'+
                '<Comprobantes>\n';

            while(!busqStop){
                for ( var i = 0; resultBolMas != null && i < resultBolMas.length; i++){
                    if(scriptObj.getRemainingUsage() < 500){
                        superaMemoria = true;
                        break;
                    }
                    row  = resultBolMas[i].columns;
                    //log.error("row", row);
                    var arrayItems = new Array();
                    var monto_1001 = 0.0;
                    var id_doc  = resultBolMas[i].getValue(row[1]);
                    tranID  = id_doc;
                    var cant_id = resultBolMas[i].getValue(row[22]);
                    //log.error("id_doc", id_doc);
                    //log.error("cant_id", cant_id);

                    k = 1;
                    if (k == 1 && resultBolMas[i].getValue(row[15]) != 1) {
                        continue;
                    }
                    while(k <= cant_id){
                        if (k == 1) {
                            sig_num = true;
                            cantidadTx++;
                            main_id = resultBolMas[i].id;
                            arrayMainID.push(main_id);
                            //log.error("main_id", main_id);
                            //log.error("id_doc", id_doc);
                            /* Se obtiene estado y respuesta para lógica de reasignación de preimpreso */
                            var status   = resultBolMas[i].getValue(row[3]);
                            var response = resultBolMas[i].getValue(row[4]);
                            //log.error("#######response1#######", response);
                            if (status == "ERROR" || status == "RECHAZADO") {
                                response_temp = response.split(" * ")[1];
                                if (response_temp != "" && response_temp != null) {
                                    response = response_temp;
                                    //log.error("response2", response);
                                }
                            }
                            var customer   = resultBolMas[i].getValue(row[6]);
                            var period     = resultBolMas[i].getValue(row[7]);
                            //log.error("period - periodtext", codDoc + " - " + resultBolMas[i].getText(row[6]));
                            var date       = resultBolMas[i].getValue(row[8]);
                                date       = FormatoDDMMYYY(date);
                            //codDoc           = resultBolMas[i].getValue(row[10]);
                            //log.error("codDoc - codDoctext", codDoc + " - " + resultBolMas[i].getText(row[9]));
                            var serie      = resultBolMas[i].getText(row[11]);
                            //puntoDeVentaIdWS = '1001';
                            var preimpreso = resultBolMas[i].getValue(row[12]);
                            //log.error("response3", response);
                            numeracion = nroCbte;
                            if (response != "" && ((response >= 0 && response <= 1999) || (response >= 4000 && response <= 9999))) {
                                //nroCbte = preimpreso;
                                numeracion = preimpreso;
                                sig_num = false;
                                log.error("main_id", main_id);
                                log.error("id_doc", id_doc);
                                log.error("******preimpreso******", preimpreso);
                            }/*else if(response >= 2000 && response <= 3999){
                                nroCbte = nroCbte;
                                //sig_num = true;
                            }*/
                            array_nrCbte.push(numeracion);
                            numeracion = "" + numeracion;
                            var pad = "00000000";
                            numeracion = pad.substring(0, pad.length - numeracion.length) + numeracion;
                            //log.error("numeracion", numeracion);
                            //log.error("nroCbte2", nroCbte);

                            var currency     = resultBolMas[i].getText(row[13]);
                                currency     = "PEN";
                            var exchangerate = resultBolMas[i].getValue(row[14]);
                            var email        = resultBolMas[i].getValue(row[21]);

                            //log.error("customer", customer);
                            var customer = record.load({type: record.Type.CUSTOMER, id: customer});
                            var custm_numdoc   = customer.getValue('vatregnumber');
                            var PriceTypeCode  = "01";
                            //if (i == 3) {
                            /*if (custm_numdoc == "42799930") {
                                PriceTypeCode  = "0123";
                            }*/
                            var custm_typeDoc  = customer.getValue('custentity_cod_tipo_doc_id_sunat');
                            var custm_cmpyname = customer.getValue('companyname');
                            var custm_address  = customer.getValue('billaddr1');

                        }
                        var itemDetail = new Array();

                        var id_line = resultBolMas[i].getValue(row[15]);
                        itemDetail.push(id_line);
                        var item    = resultBolMas[i].getText(row[16]);
                        itemDetail.push(item);
                        var description = resultBolMas[i].getValue(row[17]);
                            description = description.replace(/\r\n/gi, " ");
                            description = description.replace(/<br\s*[\/]?>/gi, " ");
                            description = description.replace(/\n/gi, " ");
                        itemDetail.push(description);
                        var quantity = resultBolMas[i].getValue(row[18]);
                            //quantity = Math.abs(quantity);
                        itemDetail.push(quantity);
                        var rate    = parseFloat(resultBolMas[i].getValue(row[19]));
                        itemDetail.push(rate);
                        var taxcode = resultBolMas[i].getValue(row[20]);
                        itemDetail.push(taxcode);

                        var item_amount = quantity*rate;
                        itemDetail.push(item_amount);

                        monto_1001 += item_amount;

                        arrayItems.push(itemDetail);

                        if (k == cant_id) {
                            xmlEnvio +=
                                '<Comprobante>\n'+
                                '<informacionOrganismo>\n'+
                                '<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:ccts="urn:un:unece:uncefact:documentation:2" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2" xmlns:qdt="urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2" xmlns:sac="urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1" xmlns:udt="urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n'+
                                    '\t<ext:UBLExtensions>\n'+
                                        '\t\t<ext:UBLExtension>\n'+
                                            '\t\t\t<ext:ExtensionContent>\n'+
                                                '\t\t\t\t<sac:AdditionalInformation>\n'+
                                                    '\t\t\t\t\t<sac:AdditionalMonetaryTotal>\n'+
                                                        '\t\t\t\t\t\t<cbc:ID>1001</cbc:ID>\n'+
                                                        '\t\t\t\t\t\t<cbc:PayableAmount currencyID="'+currency+'">'+monto_1001.toFixed(2)+'</cbc:PayableAmount>\n'+
                                                    '\t\t\t\t\t</sac:AdditionalMonetaryTotal>\n'+
                                                    '\t\t\t\t\t<sac:AdditionalMonetaryTotal>\n'+
                                                        '\t\t\t\t\t\t<cbc:ID>1002</cbc:ID>\n'+
                                                        '\t\t\t\t\t\t<cbc:PayableAmount currencyID="'+currency+'"></cbc:PayableAmount>\n'+
                                                    '\t\t\t\t\t</sac:AdditionalMonetaryTotal>\n'+
                                                    '\t\t\t\t\t<sac:AdditionalMonetaryTotal>\n'+
                                                        '\t\t\t\t\t\t<cbc:ID>2005</cbc:ID>\n'+
                                                        '\t\t\t\t\t\t<cbc:PayableAmount currencyID="'+currency+'"></cbc:PayableAmount>\n'+
                                                    '\t\t\t\t\t</sac:AdditionalMonetaryTotal>\n'+
                                                '\t\t\t\t</sac:AdditionalInformation>\n'+
                                            '\t\t\t</ext:ExtensionContent>\n'+
                                        '\t\t</ext:UBLExtension>\n'+
                                    '\t</ext:UBLExtensions>\n'+
                                    '\t<cbc:UBLVersionID>2.0</cbc:UBLVersionID>\n'+
                                    '\t<cbc:CustomizationID>1.0</cbc:CustomizationID>\n'+
                                    '\t<cbc:ID>'+serie+'-'+numeracion+'</cbc:ID>\n'+
                                    '\t<cbc:IssueDate>'+date+'</cbc:IssueDate>\n'+
                                    '\t<cbc:InvoiceTypeCode>'+codDoc+'</cbc:InvoiceTypeCode>\n'+
                                    '\t<cbc:DocumentCurrencyCode>'+currency+'</cbc:DocumentCurrencyCode>\n'+
                                    '\t<cac:AccountingSupplierParty>\n'+
                                        '\t\t<cbc:CustomerAssignedAccountID>'+subsi_numdoc+'</cbc:CustomerAssignedAccountID>\n'+
                                        '\t\t<cbc:AdditionalAccountID>'+subsi_typeDoc+'</cbc:AdditionalAccountID>\n'+
                                        '\t\t<cac:Party>\n'+
                                            '\t\t\t<cac:PostalAddress>\n'+
                                                '\t\t\t\t<cbc:ID>'+UBIGEO+'</cbc:ID>\n'+
                                                '\t\t\t\t<cbc:StreetName>'+''+'</cbc:StreetName>\n'+
                                                '\t\t\t\t<cbc:CityName>'+''+'</cbc:CityName>\n'+
                                                '\t\t\t\t<cbc:CountrySubentity>'+subsi_state+'</cbc:CountrySubentity>\n'+
                                                '\t\t\t\t<cbc:District>'+''+'</cbc:District>\n'+
                                                '\t\t\t\t<cac:Country>\n'+
                                                    '\t\t\t\t\t<cbc:IdentificationCode>PE</cbc:IdentificationCode>\n'+
                                                '\t\t\t\t</cac:Country>\n'+
                                            '\t\t\t</cac:PostalAddress>\n'+
                                            '\t\t\t<cac:PartyLegalEntity>\n'+
                                                '\t\t\t\t<cbc:RegistrationName>'+subsi_cmpyname+'</cbc:RegistrationName>\n'+
                                            '\t\t\t</cac:PartyLegalEntity>\n'+
                                        '\t\t</cac:Party>\n'+
                                    '\t</cac:AccountingSupplierParty>\n'+
                                    '\t<cac:AccountingCustomerParty>\n'+
                                        '\t\t<cbc:CustomerAssignedAccountID>'+custm_numdoc+'</cbc:CustomerAssignedAccountID>\n'+
                                        '\t\t<cbc:AdditionalAccountID>'+custm_typeDoc+'</cbc:AdditionalAccountID>\n'+
                                        '\t\t<cac:Party>\n'+
                                            '\t\t\t<cac:PhysicalLocation>\n'+
                                                '\t\t\t\t<cbc:Description>'+custm_address+'</cbc:Description>\n'+
                                            '\t\t\t</cac:PhysicalLocation>\n'+
                                            '\t\t\t<cac:PartyLegalEntity>\n'+
                                                '\t\t\t\t<cbc:RegistrationName>'+custm_cmpyname+'</cbc:RegistrationName>\n'+
                                            '\t\t\t</cac:PartyLegalEntity>\n'+
                                        '\t\t</cac:Party>\n'+
                                    '\t</cac:AccountingCustomerParty>\n'+
                                    '\t<cac:TaxTotal>\n'+
                                        '\t\t<cbc:TaxAmount currencyID="'+currency+'">'+(monto_1001*0.18).toFixed(2)+'</cbc:TaxAmount>\n'+
                                        '\t\t<cac:TaxSubtotal>\n'+
                                            '\t\t\t<cbc:TaxAmount currencyID="'+currency+'">'+(monto_1001*0.18).toFixed(2)+'</cbc:TaxAmount>\n'+
                                            '\t\t\t<cac:TaxCategory>\n'+
                                                '\t\t\t\t<cac:TaxScheme>\n'+
                                                    '\t\t\t\t\t<cbc:ID>1000</cbc:ID>\n'+
                                                    '\t\t\t\t\t<cbc:Name>IGV</cbc:Name>\n'+
                                                    '\t\t\t\t\t<cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>\n'+
                                                '\t\t\t\t</cac:TaxScheme>\n'+
                                            '\t\t\t</cac:TaxCategory>\n'+
                                        '\t\t</cac:TaxSubtotal>\n'+
                                    '\t</cac:TaxTotal>\n'+
                                    '\t<cac:LegalMonetaryTotal>\n'+
                                        '\t\t<cbc:PayableAmount currencyID="'+currency+'">'+(monto_1001*1.18).toFixed(2)+'</cbc:PayableAmount>\n'+
                                    '\t</cac:LegalMonetaryTotal>\n';
                            for (var m = 0; m < arrayItems.length; m++) {
                                var detalle = arrayItems[m];
                                xmlEnvio +=
                                    '\t<cac:InvoiceLine>\n'+
                                        '\t\t<cbc:ID>'+detalle[0]+'</cbc:ID>\n'+
                                        '\t\t<cbc:InvoicedQuantity unitCode="NIU">'+detalle[3]+'</cbc:InvoicedQuantity>\n'+
                                        '\t\t<cbc:LineExtensionAmount currencyID="'+currency+'">'+detalle[6].toFixed(2)+'</cbc:LineExtensionAmount>\n'+
                                        '\t\t<cac:PricingReference>\n'+
                                            '\t\t\t<cac:AlternativeConditionPrice>\n'+
                                                //<#assign precUnit = item.rate + item.rate*item.taxrate1?c?number>
                                                '\t\t\t\t<cbc:PriceAmount currencyID="'+currency+'">'+(detalle[4]*1.18).toFixed(2)+'</cbc:PriceAmount>\n'+
                                                '\t\t\t\t<cbc:PriceTypeCode>'+PriceTypeCode+'</cbc:PriceTypeCode>\n'+
                                            '\t\t\t</cac:AlternativeConditionPrice>\n'+
                                        '\t\t</cac:PricingReference>\n'+
                                        '\t\t<cac:TaxTotal>\n'+
                                            '\t\t\t<cbc:TaxAmount currencyID="'+currency+'">'+(detalle[6]*0.18).toFixed(2)+'</cbc:TaxAmount>\n'+
                                            '\t\t\t<cac:TaxSubtotal>\n'+
                                                '\t\t\t\t<cbc:TaxAmount currencyID="'+currency+'">'+(detalle[6]*0.18).toFixed(2)+'</cbc:TaxAmount>\n'+
                                                '\t\t\t\t<cac:TaxCategory>\n'+
                                                    '\t\t\t\t\t<cbc:TaxExemptionReasonCode>10</cbc:TaxExemptionReasonCode>\n'+
                                                    '\t\t\t\t\t<cac:TaxScheme>\n'+
                                                        '\t\t\t\t\t\t<cbc:ID>1000</cbc:ID>\n'+
                                                        '\t\t\t\t\t\t<cbc:Name>IGV</cbc:Name>\n'+
                                                        '\t\t\t\t\t\t<cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>\n'+
                                                    '\t\t\t\t\t</cac:TaxScheme>\n'+
                                                '\t\t\t\t</cac:TaxCategory>\n'+
                                            '\t\t\t</cac:TaxSubtotal>\n'+
                                        '\t\t</cac:TaxTotal>\n'+
                                        '\t\t<cac:Item>\n'+
                                            '\t\t\t<cbc:Description>'+detalle[2]+'</cbc:Description>\n'+
                                            '\t\t\t<cac:SellersItemIdentification>\n'+
                                                '\t\t\t\t<cbc:ID>'+detalle[1]+'</cbc:ID>\n'+
                                            '\t\t\t</cac:SellersItemIdentification>\n'+
                                        '\t\t</cac:Item>\n'+
                                        '\t\t<cac:Price>\n'+
                                            '\t\t\t<cbc:PriceAmount currencyID="'+currency+'">'+detalle[4].toFixed(2)+'</cbc:PriceAmount>\n'+
                                        '\t\t</cac:Price>\n'+
                                    '\t</cac:InvoiceLine>\n';
                            }

                            xmlEnvio +=
                                '</Invoice>\n'+
                                '</informacionOrganismo>\n'+
                                '</Comprobante>\n';

                            if (sig_num) {
                                nroCbte++;
                            }
                            /*nroCbte = "" + nroCbte;
                            var pad = "00000000";
                            nroCbte = pad.substring(0, pad.length - nroCbte.length) + nroCbte;*/
                            //log.error("nroCbte", nroCbte);

                        }else{
                            i++;
                        }
                        k++;
                        //j++;
                    }
                    //log.error("Remaining governance units: " + scriptObj.getRemainingUsage());
                }
                log.error("resultBolMas.length", resultBolMas.length);
                /*
                if(resultBolMas.length == 1000){
                    initMinDoc = initMinDoc + 1000;
                    initMaxDoc = initMaxDoc + 1000;
                    resultBolMas = objbuqBolMas.getResults(initMinDoc, initMaxDoc);
                }else{
                    busqStop = true;
                }*/
                busqStop = true;
            }

            xmlEnvio +=
                '</Comprobantes>';

            log.error("Remaining governance units: " + scriptObj.getRemainingUsage());

            /* Prueba Envio correo*/

            var FileName = 'Archivo Facturacion Electronica PE.xml';

            fileXML[0] = file.create({
                            name    : FileName,
                            fileType: file.Type.XMLDOC,
                            contents: xmlEnvio
                        });

            /* Obtiene empleado receptor email */
            user_emp  = scriptObj.getParameter({name: 'custscript_lmry_pe_email_emp_einvoice'});

            recEmp = search.lookupFields({
                type   : search.Type.EMPLOYEE,
                id     : user_emp,
                columns: ['firstname', 'email'] 
            });
            nameUser  = recEmp.firstname;
            emailUser = recEmp.email;

            ///////////////////////

            log.error("WSIniSesion", "WSIniSesion");
            returnIniSesion = WSIniSesion();
            if (returnIniSesion == 'Error') {
                mailResumen();
                return true;
            }
            /*
            fileXML[1] = file.create({
                        name    : "WSIniSesion",
                        fileType: file.Type.XMLDOC,
                        contents: returnIniSesion
                    });*/

            EMAIL.send({
                author: user_emp,
                recipients: emailUser,
                subject: "Prueba PE XML BM",
                body: "Body blabla",
                attachments: fileXML
            });

            log.error("WSAutCbtsAsinc", "WSAutCbtsAsinc");
            var returnAutCbtsAsinc  = WSAutCbtsAsinc(xmlEnvio);
            if (returnAutCbtsAsinc == 'Error') {
                mailResumen();
                return true;
            }
            //return true;
            /* Tiempo de espera de respuesta de SUNAT */
            sleep(2500);

            var returnSalidaTransac = '';
            if(TransaccionId != ''){
                returnSalidaTransac = WSSalidaTransac();
                if (returnSalidaTransac == 'Error') {
                    mailResumen();
                    return true;
                }
            }

            if(error_log){
                log.error("te pones loquita de noche", "loquita mamita");
            }

            msjResponseLog = "Autorizados: " + cant_autorizado + " | Aceptados: " + cant_aceptado + " | Rechazados: " + cant_rechazado + " | Procesando: " + cant_procesando + " | Error: " + cant_error;

            log.error("msjResponseLog", msjResponseLog);
            record.submitFields({
                type  : LOGRECORD_ID,
                id    : id_BMlog,
                values: {custrecord_lmry_pe_ei_bm_status: 'Enviado - ' + TransaccionId, custrecord_lmry_pe_ei_bm_response: msjResponseLog, custrecord_lmry_pe_ei_bm_n_transaction: parseInt(cantidadTx)}
            });

            log.error("Remaining governance units: " + scriptObj.getRemainingUsage());
            if(superaMemoria || resultBolMas.length == initMaxDoc){
                //busqStop = true;
                var params = {};

                params['custscript_lmry_pe_ei_date_from'] = param_date_from;
                params['custscript_lmry_pe_ei_date_to']   = param_date_to;
                params['custscript_lmry_pe_ei_serie']     = param_serie;

                if (subsi) {
                    params['custscript_lmry_pe_ei_subsidiary'] = param_subsidiary;
                }

                log.error("params", params);
                /* Tiempo de espera antes de relanzar schedule 
                 * para obtener un nuevo UltimoNroCbte */
                sleep(8000);

                var schdl_task = task.create({
                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                    scriptId: "customscript_lmry_pe_ei_bm_schdl",
                    deploymentId: "customdeploy_lmry_pe_ei_bm_schdl",
                    params: params
                });
                schdl_task.submit();

                log.error("task_status", schdl_task);
            }else{
                mailResumen();
            }

            log.error("FIN", "FIN");

        }catch(e){
            log.error("Catch", e.valueOf().toString());
            msjResponseLog = "Autorizados: " + cant_autorizado + " | Aceptados: " + cant_aceptado + " | Rechazados: " + cant_rechazado + " | Procesando: " + cant_procesando + " | Error: " + cant_error;
            record.submitFields({
                type  : LOGRECORD_ID,
                id    : id_BMlog,
                values: {custrecord_lmry_pe_ei_bm_status: 'Enviado - ' + TransaccionId, custrecord_lmry_pe_ei_bm_response: msjResponseLog, custrecord_lmry_pe_ei_bm_n_transaction: parseInt(cantidadTx)}
            });
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
                values: {custrecord_lmry_pe_ei_bm_status: 'Error - ' + TransaccionId, custrecord_lmry_pe_ei_bm_response: "Error Inesperado al iniciar sesión", custrecord_lmry_pe_ei_bm_n_transaction: parseInt(cantidadTx)}
            });
            return 'Error';
        }

        var returnIniSesion = objIniSesion.body;
            returnIniSesion = replaceXML(returnIniSesion);

        log.error("returnIniSesion", returnIniSesion);

        var sesion = returnIniSesion.split('SesionId')[1];
        if(sesion != null && sesion != ''){
            SesionId = sesion.substring(1, sesion.length-2);
            FechaVencimiento = returnIniSesion.split('FechaVencimiento')[1];
            FechaVencimiento = FechaVencimiento.substring(1, FechaVencimiento.length-2);
        }

        return returnIniSesion;
    }

    function WSAutCbtsAsinc(xml){
        
        var StringXML = 
            '<?xml version="1.0" encoding="utf-8"?>'+
            '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'+
            '<soap:Body>'+
                '<AutorizarComprobantesAsincronico xmlns="http://comfiar.com.ar/webservice/">'+
                  '<XML><![CDATA['+xml+']]></XML>'+
                  '<cuitAProcesar>'+cuitId+'</cuitAProcesar>'+
                  '<puntoDeVentaId>'+puntoDeVentaIdWS+'</puntoDeVentaId>'+
                  '<tipoDeComprobanteId>'+codDoc+'</tipoDeComprobanteId>'+
                  '<formatoId>'+FORMATO_WS+'</formatoId>'+
                  '<token>'+
                    '<SesionId>'+SesionId+'</SesionId>'+
                    '<FechaVencimiento>'+FechaVencimiento+'</FechaVencimiento>'+
                  '</token>'+
                '</AutorizarComprobantesAsincronico>'+
              '</soap:Body>'+
            '</soap:Envelope>'; 

        var soapHeaders = new Array(); 
            soapHeaders['Host'] = HOST_WS;
            soapHeaders['Content-Type'] = 'text/xml; charset=utf-8'; 
            soapHeaders['Content-Length'] = 'length';
            soapHeaders['SOAPAction'] = "http://comfiar.com.ar/webservice/AutorizarComprobantesAsincronico";
            
        var objAutCbtsAsinc = '';

        try{
            if (AMBIENTE_WS == '1') {
                require(['N/http'], function(http) {
                    objAutCbtsAsinc    =
                        http.post({
                            url: URL_WS,
                            body: StringXML,
                            headers: soapHeaders
                        });
                });
            }else if(AMBIENTE_WS == '2'){
                require(['N/https'], function(https) {
                    objAutCbtsAsinc    =
                        https.post({
                            url: URL_WS,
                            body: StringXML,
                            headers: soapHeaders
                        });
                });
            }
        }catch(e){
            log.error('CATCH ERROR WSAutCbtsAsinc', e);
            var msjCatch = e.valueOf().toString().substring(0,300);
            log.error('CATCH ERROR WSAutCbtsAsinc MSJCATCH', msjCatch);
            record.submitFields({
                type  : LOGRECORD_ID,
                id    : id_BMlog,
                values: {custrecord_lmry_pe_ei_bm_status: 'Error - ' + TransaccionId, custrecord_lmry_pe_ei_bm_response: "Error Inesperado al consumir WS Autorizar Comprobantes", custrecord_lmry_pe_ei_bm_n_transaction: parseInt(cantidadTx)}
            });
            return 'Error';
        }
        log.error("WSAutCbtsAsinc fin http(s).post", "WSAutCbtsAsinc fin http(s).post");

        var returnAutCbtsAsinc = objAutCbtsAsinc.body;
            returnAutCbtsAsinc = replaceXML(returnAutCbtsAsinc);

        log.error("returnAutCbtsAsinc", returnAutCbtsAsinc);

        //var AutCbtsAsincResult = returnAutCbtsAsinc.split('AutorizarComprobantesAsincronicoResult')[1];
        var SalidaTransaccion = returnAutCbtsAsinc.split('SalidaTransaccion')[1];
        if(SalidaTransaccion != null && SalidaTransaccion != ''){
            var TransacId = SalidaTransaccion.split('ID')[1];
            if(TransacId != null && TransacId != ''){
                TransaccionId = TransacId.substring(1, TransacId.length-2);
                log.error("TransaccionId", TransaccionId);
            }
        }
        
        return returnAutCbtsAsinc;
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

        /*fileXML[2] = file.create({
                        name    : "WSSalidaTransac",
                        fileType: file.Type.XMLDOC,
                        contents: StringXML
                    });*/
            
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
                values: {custrecord_lmry_pe_ei_bm_status: 'Error - ' + TransaccionId, custrecord_lmry_pe_ei_bm_response: "Error Inesperado al consumir WS Salida de Transacción", custrecord_lmry_pe_ei_bm_n_transaction: parseInt(cantidadTx)}
            });
            return 'Error';
        }
        log.error("WSSalidaTransac fin http(s).post", "WSSalidaTransac fin http(s).post");

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
                logError(arrayMainID[i], TransaccionId, nroCbte_init++, status_doc, mensajeError);
            }
            /* MENSAJE PROCESANDO */
            //cant_procesando++;
            cant_procesando = cantidadTx;
        }else if (error != null && error != '') {
            error = error.split('Error>')[1];
            error = error.substring(0, error.length-2);
            status_doc   = "ERROR";
            mensajeError = error;
            for (var i = 0; i < arrayMainID.length; i++) {
                logError(arrayMainID[i], TransaccionId, nroCbte_init++, status_doc, mensajeError);
            }
            //cant_error++;
            cant_error = cantidadTx;
        }else if(infoComfiar != null && infoComfiar.length != 1){
            main_id_cont = 0;
            log.error("array_nrCbte.length", array_nrCbte.length);
            log.error("arrayMainID.length", arrayMainID.length);
            for (var j = 1; j < infoComfiar.length; j=j+2) {
                mensajeError = "";
                infoComfiar_temp = infoComfiar[j];
                estado = infoComfiar_temp.split('Estado>')[1];
                estado = estado.substring(0, estado.length-2);
                log.error("******doc_internalid******", arrayMainID[main_id_cont]);
                log.error("doc_numeracion", array_nrCbte[main_id_cont]);
                log.error("doc_estado", estado);
                if (estado == 'ACEPTADO' || estado == 'AUTORIZADO') {
                    exito = true;
                    status_doc = estado;

                    if (estado == 'ACEPTADO') {
                        cant_aceptado++;
                    }else{
                        cant_autorizado++;
                    }

                }else{
                    exito = false;
                    //status_doc = "RECHAZADO";
                    if (estado == "ERROR") {
                        estado = "RECHAZADO";
                    }
                    status_doc     = estado;
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

                            mensajeError += "ID Error * " + mensaje_id + " * - " + mensaje + "\n";
                        }

                        log.error("doc_mensajeError", mensajeError);
                    }
                    cant_rechazado++;
                }
                
                logError(arrayMainID[main_id_cont], TransaccionId, array_nrCbte[main_id_cont], status_doc, mensajeError);
                //logError(arrayMainID[main_id_cont], TransaccionId, nroCbte_init++, status_doc, mensajeError);
                main_id_cont++;
            }
            log.error("main_id_cont", main_id_cont);
        }
        log.error("status_doc - mensajeError", status_doc + " - " + mensajeError);

        return returnSalidaTransac;
    }

    function WSUltimoNroCbte(){

        var StringXML = 
            '<?xml version="1.0" encoding="utf-8"?>'+
            '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'+
            '  <soap:Body>'+
            '    <UltimoNumeroComprobante xmlns="http://comfiar.com.ar/webservice/">'+
            '      <cuitId>'+cuitId+'</cuitId>'+
            '      <puntoDeVentaId>'+puntoDeVentaIdWS+'</puntoDeVentaId>'+
            '      <tipoDeComprobanteId>'+codDoc+'</tipoDeComprobanteId>'+
            '      <token>'+
            '        <SesionId>'+SesionId+'</SesionId>'+
            '        <FechaVencimiento>'+FechaVencimiento+'</FechaVencimiento>'+
            '      </token>'+
            '    </UltimoNumeroComprobante>'+
            '  </soap:Body>'+
            '</soap:Envelope>';

        var soapHeaders = new Array(); 
            soapHeaders['Host'] = HOST_WS;
            soapHeaders['Content-Type'] = 'text/xml; charset=utf-8'; 
            soapHeaders['Content-Length'] = 'length';
            soapHeaders['SOAPAction'] = "http://comfiar.com.ar/webservice/UltimoNumeroComprobante";
            
        var returnUltimoNroCbte = '';
        try{
            if (AMBIENTE_WS == '1') {
                require(['N/http'], function(http) {
                    returnUltimoNroCbte    =
                        http.post({
                            url: URL_WS,
                            body: StringXML,
                            headers: soapHeaders
                        });
                });
            }else if(AMBIENTE_WS == '2'){
                require(['N/https'], function(https) {
                    returnUltimoNroCbte    =
                        https.post({
                            url: URL_WS,
                            body: StringXML,
                            headers: soapHeaders
                        });
                });
            }
        }catch(e){
            log.error('CATCH ERROR WSUltimoNroCbte', e);
            var msjCatch = e.valueOf().toString().substring(0,300);
            log.error('CATCH ERROR WSUltimoNroCbte MSJCATCH', msjCatch);
            record.submitFields({
                type  : LOGRECORD_ID,
                id    : id_BMlog,
                values: {custrecord_lmry_pe_ei_bm_status: 'Error - ' + TransaccionId, custrecord_lmry_pe_ei_bm_response: "Error Inesperado al consumir WS Último Nro Comprobante", custrecord_lmry_pe_ei_bm_n_transaction: parseInt(cantidadTx)}
            });
            return 'Error';
        }

        log.error("returnUltimoNroCbte", replaceXML(returnUltimoNroCbte.body));

        var UltimoNroCbteResult = returnUltimoNroCbte.body.split('UltimoNumeroComprobanteResult')[1];
        if(UltimoNroCbteResult != null && UltimoNroCbteResult != ''){

            secuencial = UltimoNroCbteResult.substring(1, UltimoNroCbteResult.length-2);
            secuencial++;

            secuencial   = "" + secuencial;
            var pad      = "00000000";
            secuencial   = pad.substring(0, pad.length - secuencial.length) + secuencial;
            nroCbte      = secuencial;
            nroCbte_init = nroCbte;
        }

        return returnUltimoNroCbte.body;
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

    function logError(main_id, TransaccionId, num, status_doc, resp){

        var params = {};

        params['custrecord_lmry_pe_ei_id']     = TransaccionId;
        params['custrecord_lmry_pe_ei_status'] = status_doc;
        if (exito) {
            params['custrecord_lmry_pe_ei_response'] = "";
        }else{
            params['custrecord_lmry_pe_ei_response'] = resp;
        }
        num = "" + num;
        var pad = "00000000";
        num = pad.substring(0, pad.length - num.length) + num;
        params['custrecord_lmry_pe_ei_preprint_number'] = num;

        //log.error("DOCRECORD_ID - main_id", DOCRECORD_ID + " - " + main_id);
        //log.error("params", params);

        try{
            record.submitFields({
                        type  : DOCRECORD_ID,
                        id    : main_id,
                        values: params
                    });
        }catch(e){
            log.error('CATCH ERROR logError', e);
            var msjCatch = e.valueOf().toString().substring(0,300);
            log.error('CATCH ERROR logError MSJCATCH', msjCatch);

            log.error("DOCRECORD_ID - main_id", DOCRECORD_ID + " - " + main_id);
            log.error("params", params);
            error_log = true;
        }
        
    }

    function mailResumen(){
        var schdl_task = task.create({
            taskType: task.TaskType.SCHEDULED_SCRIPT,
            scriptId: "customscript_lmry_pe_ei_bm_mail_schdl",
            deploymentId: "customdeploy_lmry_pe_ei_bm_mail_schdl",
            //params: params
        });
        schdl_task.submit();

        log.error("task_status", schdl_task);
    }

    function sleep(milliseconds) {
      var start = new Date().getTime();
      for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds){
          break;
        }
      }
    }

    function replaceXML(xml){
        xml = xml.replace(/&lt;/g, '<');
        xml = xml.replace(/&gt;/g, '>');
        xml = xml.replace(/&amp;lt;/g, '<');
        xml = xml.replace(/&amp;gt;/g, '>');

        return xml;
    }

    function unReplaceXML(xml){
        xml = xml.replace(/</g, '&lt;');
        xml = xml.replace(/>/g, '&gt;');

        return xml;
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

        var fechaOrden = y+'-'+m+'-'+d;

        return fechaOrden;
    }

    function revertFormatoAAAAMMDD(fecha){

        var y = fecha.substring(0,4);
        var m = fecha.substring(5,7);
        var d = fecha.substring(8,10);

        var stringFecha = m + "/" + d + "/" + y;
        var revertfecha = new Date(stringFecha);

        return revertfecha;
    }

    function getNameTypeDoc(codDoc){
        var nameTypeDoc = null;
        if (codDoc == '03') {
            nameTypeDoc = "Boleta de Venta Electrónica";
        }else if (codDoc == '07') {
            nameTypeDoc = "Nota Crédito Electrónica";
        }else if (codDoc == '103') {
            nameTypeDoc = "Nota Débito e-Ticket";
        }
        return nameTypeDoc;
    }

    return {
        execute: execute
    };

});