/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       18 Jun 2011     Ezi
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */

    var objContext = nlapiGetContext();

    var URL_WS      = '';
    var USER        = '';
    var PASSWORD    = '';
    var UBIGEO      = '122345';
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
    var flag_schdl= false;

    var param_numComprobante='';
    var param_finDeploy='';

    function lmry_ei_bol_mas_rech(type)
    {
        try{

            nlapiLogExecution('ERROR','INICIO', 'INICIO');
            //return true;
            getEnableFeatures();

            // Valida si es OneWorld
            var featuresubs = objContext.getFeature('SUBSIDIARIES');
            var param_subsidiary = '';  

            // Parametros
                        
            var param_date_from   = objContext.getSetting('SCRIPT', 'custscript_lmry_pe_rech_date_from');
            var param_date_to     = objContext.getSetting('SCRIPT', 'custscript_lmry_pe_rech_date_to');
            var param_serie       = objContext.getSetting('SCRIPT', 'custscript_lmry_pe_rech_series');
            var subsidiary   = null;
            var subsi_numdoc = "";
            if (featuresubs == true || featuresubs == 'T'){
                param_subsidiary = objContext.getSetting('SCRIPT', 'custscript_lmry_pe_rech_subsi');

            }else{
                subsidiary = nlapiLoadConfiguration('companyinformation');
                 subsi_numdoc   = subsidiary.getFieldValue('employerid');
            }

            // Define search filters
            var filters = new Array();
            // Define search columns
            var columns = new Array();
                columns[0] = new nlobjSearchColumn('custrecord_lmry_pe_ei_ejecu',null,'max');
            // Create the saved search
            var searchLote = nlapiCreateSearch( 'customrecord_lmry_pe_ei_bol_mas_log', filters, columns );
            var objsearchLote   = searchLote.runSearch();
            var resultsearchLote   = objsearchLote.getResults(0,5);
            var rowLote  = resultsearchLote[0].getAllColumns();
                lote_lote  = resultsearchLote[0].getValue(rowLote[0]);

                nlapiLogExecution('ERROR','lote_lote',lote_lote);
            var param_lote=parseInt(lote_lote)+1;
              nlapiLogExecution('ERROR','param_lote',param_lote);


            //nlapiLogExecution('ERROR', 'PARAMETROS OBTENIDOS', 'SUB: '+param_subsidiary+'. ENT: '+paramEntidad+'. DFR: '+paramDateFrom+' . DTO: '+paramDateTo+ ' .FAC: ' +paramFactura+' . TIPO: '+paramIdent);
            nlapiLogExecution('ERROR', 'EJECUTANDO SCHEDULE PARA CREACION XML', 'EJECUTANDO SCHEDULE PARA CREACION XML');

             //param_numComprobante = objContext.getSetting('SCRIPT', 'custscript_lmry_primer_comprobante');
             //param_finDeploy = objContext.getSetting('SCRIPT', 'custscript_lmry_estado_schdl');

          
            //var param_serie = '';
            cuitId             = subsi_numdoc;
            var subsi_typeDoc  = subsidiary.getFieldValue('custrecord_tipo_doc_id_sunat_id');
            var subsi_cmpyname = subsidiary.getFieldValue('legalname');
            var subsi_state    = subsidiary.getFieldValue('state');
        
            nlapiLogExecution('ERROR','subsi_numdoc - subsi_typeDoc - subsi_cmpyname - subsi_state', subsi_numdoc + '-' + subsi_typeDoc + ' -' + subsi_cmpyname + ' -' + subsi_state);
            nlapiLogExecution('ERROR','param_date_from - param_date_to - param_serie', param_date_from + ' -'  + param_date_to + ' -'  + param_serie);
           
            recordBMlog = nlapiCreateRecord(LOGRECORD_ID);
            recordBMlog.setFieldValue('custrecord_lmry_pe_ei_bm_subsidiary',nlapiGetSubsidiary());
            recordBMlog.setFieldValue('custrecord_lmry_pe_ei_bm_user',nlapiGetUser());
            recordBMlog.setFieldValue('custrecord_lmry_pe_ei_ejecu',param_lote);
            recordBMlog.setFieldValue('custrecord_lmry_pe_ei_bm_status','Procesando');
            id_BMlog = nlapiSubmitRecord(recordBMlog);

        

            var returnIniSesion = WSIniSesion();
            if (returnIniSesion == 'Error') {
               // mailResumen();
                return true;
            }
            /* Automatizar para demás comprobantes. Ahora esta hardcode solo para Boletas */
            //cuitId = "20556406881";
            /* Registro Personalizado LatamReady - PE Puntos Ventas WS
                var serie  = resultPtoVta[i].getValue(row[0]);
                var ptoVta = resultPtoVta[i].getValue(row[1]);
            */
            
            //log.error("puntoDeVentaIdWS", puntoDeVentaIdWS);
            codDoc = '03';
            puntoDeVentaIdWS = '1001';
            /* Búsqueda Personalizada LatamReady - PE EI Boleteo Masivo Docs */ 
            var busqBolMas = nlapiLoadSearch('customrecord_lmry_pe_ei_boleteo_masivo', 'customsearch_lmry_pe_ei_bol_mas_docs');         
            
            if(param_date_from!='' && param_date_from!='null' && param_date_from!=null){
                busqBolMas.addFilter(new nlobjSearchFilter('custrecord_lmry_pe_ei_date', null, 'onorafter', param_date_from));
            }
            if(param_date_to!='' && param_date_to!='null' && param_date_to!=null){
                busqBolMas.addFilter(new nlobjSearchFilter('custrecord_lmry_pe_ei_date', null, 'onorbefore', param_date_to));
            }
                        
            busqBolMas.addFilter(new nlobjSearchFilter('custrecord_lmry_pe_ei_status', null, 'is', 'RECHAZADO'));
            
            busqBolMas.addFilter(new nlobjSearchFilter('custrecord_lmry_pe_ei_point_sale', null, 'anyof', param_serie));

            if ((featuresubs == true || featuresubs == 'T') && param_subsidiary!='' && paramSubsidiaria!='null' && param_subsidiary!=null){
                  busqBolMas.addFilter(new nlobjSearchFilter('custrecord_lmry_pe_ei_subsidiary', null, 'anyof', param_subsidiary));
            }
         

           
            var initMinDoc = 0;
            var initMaxDoc = 1000;
            var objbuqBolMas   = busqBolMas.runSearch();
            var resultBolMas   = objbuqBolMas.getResults(initMinDoc, initMaxDoc);
            if (resultBolMas=='' || resultBolMas==null || resultBolMas.length==0)
            { 
                nlapiLogExecution('ERROR','SALDRA EN :','3...2...1..(.l.)');
                nlapiSubmitField(LOGRECORD_ID, id_BMlog, ['custrecord_lmry_pe_ei_bm_status', 'custrecord_lmry_pe_ei_bm_response'], ['Sin Transacciones', 'No hay data']);          
                return true;
            }

            //log.error("resultBolMas", resultBolMas);
            nlapiLogExecution('ERROR','resultBolMas.length', resultBolMas.length);
            //cantidadTx = resultBolMas.length;

            var busqStop      = false;
            var superaMemoria = false;

            xmlEnvio = ''+
                '<?xml version="1.0" encoding="ISO-8859-1" standalone="no"?>\n'+
                '<Comprobantes>\n';

            while(!busqStop){
              
                    for ( var i = 0; i < resultBolMas.length; i++){
                        
                        if(objContext.getRemainingUsage() < 300){
                           // nlapiLogExecution('ERROR','Convencela','No lo puedes hacer');
                            superaMemoria = true;
                            break;
                        }                   
                        var row  = resultBolMas[i].getAllColumns();
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
                                numeracion = preimpreso;
                                nlapiLogExecution('ERROR','NROCBTE',numeracion);

                                if (response != '' && ((response >= 0 && response <= 1999) || (response >= 4000 && response <= 9999))) {
                                    nroCbte = numeracion;
                                   
                                    nlapiLogExecution('ERROR','main_id', main_id);
                                    nlapiLogExecution('ERROR','id_doc', id_doc);
                                    nlapiLogExecution('ERROR','******preimpreso******', nroCbte);
                                }
                                array_nrCbte.push(numeracion);
                                numeracion = '' + numeracion;
                                var pad = '00000000';
                                numeracion = pad.substring(0, pad.length - numeracion.length) + numeracion;
                                //log.error("numeracion", numeracion);
                                //log.error("nroCbte2", nroCbte);

                                var currency     = resultBolMas[i].getText(row[13]);
                                    currency     = "PEN";
                                var exchangerate = resultBolMas[i].getValue(row[14]);
                                var email        = resultBolMas[i].getValue(row[21]);

                                var customer = nlapiLoadRecord('customer',customer);
                                var PriceTypeCode  = '01';
                            
                                var custm_numdoc = customer.getFieldValue('vatregnumber');
                               
                                var custm_typeDoc  = customer.getFieldValue('custentity_cod_tipo_doc_id_sunat');
                                var custm_cmpyname = customer.getFieldValue('companyname');
                                var custm_address = customer.getFieldValue('billaddr1');
                               
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
                                           //'\t\t<cbc:InvoicedQuantity unitCode="NIU">1</cbc:InvoicedQuantity>\n'+
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
                    }//Fin del for

            
            
                nlapiLogExecution('ERROR','resultBolMas.length', resultBolMas.length);
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

            nlapiLogExecution('ERROR','Remaining governance units: ',''+objContext.getRemainingUsage());

            /* Prueba Envio correo*/

            var FileName = 'Archivo Facturacion Electronica PE.xml';

            fileXML[0] = nlapiCreateFile(FileName, 'XMLDOC', xmlEnvio);

            /* Obtiene empleado receptor email */
            var currentuser = nlapiGetUser();
            //currentuser='1626';
            nlapiLogExecution('ERROR','CURRENT',currentuser);
            var recEmp      = nlapiLookupField('employee',currentuser,['firstname','email']);
            var nameUser    = recEmp.firstname;
            var emailUser   = recEmp.email;
           

            
            ///////////////////////

            nlapiLogExecution('ERROR','WSIniSesion', 'WSIniSesion');
            returnIniSesion = WSIniSesion();
            if (returnIniSesion == 'Error') {
               // mailResumen();
                nlapiLogExecution('ERROR','INICIAR',' ERROR');
                return true;
            }
            /*
            fileXML[1] = file.create({
                        name    : "WSIniSesion",
                        fileType: file.Type.XMLDOC,
                        contents: returnIniSesion
                    });*/
           // log.error("WSAutCbtsAsinc", "WSAutCbtsAsinc");
            var returnAutCbtsAsinc  = WSAutCbtsAsinc(xmlEnvio);
            if (returnAutCbtsAsinc == 'Error') {
                //mailResumen();
                 nlapiLogExecution('ERROR','ASISCONRIVO','ERROR');
                return true;
            }
            //return true;
            /* Tiempo de espera de respuesta de SUNAT */
            sleep(2500);

            var returnSalidaTransac = '';
            if(TransaccionId != ''){
                returnSalidaTransac = WSSalidaTransac();
                if (returnSalidaTransac == 'Error') {
                    //mailResumen();
                    nlapiLogExecution('ERROR','SALIDA',' ERROR');
                    return true;
                }
            }

            msjResponseLog = "Autorizados: " + cant_autorizado + " | Aceptados: " + cant_aceptado + " | Rechazados: " + cant_rechazado + " | Procesando: " + cant_procesando + " | Error: " + cant_error;

            nlapiLogExecution('ERROR','msjResponseLog', msjResponseLog);
            nlapiSubmitField(LOGRECORD_ID, id_BMlog, ['custrecord_lmry_pe_ei_bm_status', 'custrecord_lmry_pe_ei_bm_response','custrecord_lmry_pe_ei_bm_n_transaction'], ['Enviado - ' + TransaccionId, msjResponseLog,parseInt(cantidadTx)]);
            
            var params = {
                            custscript_lmry_pe_mail_lote: param_lote
                            
                        }
                    nlapiScheduleScript('customscript_lmry_pe_ei_bm_mail_schdl','customdeploy_lmry_pe_ei_bm_mail_schdl',params);
            
            nlapiLogExecution('ERROR','FIN', 'FIN');

        }catch(e){
            nlapiLogExecution('ERROR','ERROR PUE',e);
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

        var objIniSesion    =   nlapiRequestURL(URL_WS, StringXML, soapHeaders);

        var returnIniSesion = objIniSesion.getBody();
            returnIniSesion = replaceXML(returnIniSesion);

        var sesion = returnIniSesion.split('SesionId')[1];
        if(sesion != null && sesion != ''){
            SesionId = sesion.substring(1, sesion.length-2);
            FechaVencimiento = returnIniSesion.split('FechaVencimiento')[1];
            FechaVencimiento = FechaVencimiento.substring(1, FechaVencimiento.length-2);
        }else{
            return 'Error';
        }

        nlapiLogExecution('ERROR', 'SesionId - FechaVencimiento', SesionId + ' - ' + FechaVencimiento);
        nlapiLogExecution('ERROR', 'WSIniSesion', 'FIN WSIniSesion');

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
            
        var objAutCbtsAsinc  =   nlapiRequestURL(URL_WS, StringXML, soapHeaders);

        var returnAutCbtsAsinc = objAutCbtsAsinc.getBody();
            returnAutCbtsAsinc = replaceXML(returnAutCbtsAsinc);
        
        
        //var AutCbtsAsincResult = returnAutCbtsAsinc.split('AutorizarComprobantesAsincronicoResult')[1];
        var SalidaTransaccion = returnAutCbtsAsinc.split('SalidaTransaccion')[1];
        if(SalidaTransaccion != null && SalidaTransaccion != ''){
            var TransacId = SalidaTransaccion.split('ID')[1];
            if(TransacId != null && TransacId != ''){
                TransaccionId = TransacId.substring(1, TransacId.length-2);
            }
            nlapiLogExecution('ERROR', 'TransaccionId', TransaccionId);
        }

        nlapiLogExecution('ERROR', 'WSAutCbtsAsinc', 'FIN WSAutCbtsAsinc');
        
        return returnAutCbtsAsinc;
    }

    function WSSalidaTransac(){
        nlapiLogExecution('ERROR','WSSalidaTransac', 'Inicio WSSalidaTransac');

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
            
        var objSalidaTransac    =   nlapiRequestURL(URL_WS, StringXML, soapHeaders);
        nlapiLogExecution('ERROR','WSSalidaTransac fin http(s).post', 'WSSalidaTransac fin http(s).post');

        mensajeError = "";
        exito        = false;

        var returnSalidaTransac = objSalidaTransac.body;
            returnSalidaTransac = replaceXML(returnSalidaTransac);

        var estadoProceso = returnSalidaTransac.split('TransaccionSinTerminar>')[1];
        var error         = returnSalidaTransac.split('TransaccionError>')[1];
        var infoComfiar   = returnSalidaTransac.split('informacionComfiar>');

        if(estadoProceso != null && estadoProceso != ''){
            exito = true;
            status_doc = 'Procesando';

            estadoProceso = estadoProceso.split('Estado>')[1];
            estadoProceso = estadoProceso.substring(0, estadoProceso.length-2);

            for (var i = 0; i < arrayMainID.length; i++) {
                nlapiLogExecution('ERROR','Nro Cbte Procesando',nroCbte_init);
                logError(arrayMainID[i], TransaccionId, nroCbte_init++, status_doc, mensajeError);
            }
            /* MENSAJE PROCESANDO */
            //cant_procesando++;
            cant_procesando = cantidadTx;
        }else if (error != null && error != '') {
            error = error.split('Error>')[1];
            error = error.substring(0, error.length-2);
            status_doc   = 'ERROR';
            mensajeError = error;
            for (var i = 0; i < arrayMainID.length; i++) {
                nlapiLogExecution('ERROR','Nro Cbte Error',nroCbte_init);
                logError(arrayMainID[i], TransaccionId, nroCbte_init++, status_doc, mensajeError);
            }
            //cant_error++;
            cant_error = cantidadTx;
        }else if(infoComfiar != null && infoComfiar.length != 1){
            main_id_cont = 0;
            nlapiLogExecution('ERROR', 'array_nrCbte.length', array_nrCbte.length);
            nlapiLogExecution('ERROR', 'arrayMainID.length', arrayMainID.length);
            for (var j = 1; j < infoComfiar.length; j=j+2) {
                mensajeError = '';
                infoComfiar_temp = infoComfiar[j];
                estado = infoComfiar_temp.split('Estado>')[1];
                estado = estado.substring(0, estado.length-2);
                nlapiLogExecution('ERROR', '******doc_internalid******', arrayMainID[main_id_cont]);
                nlapiLogExecution('ERROR', 'doc_numeracion', array_nrCbte[main_id_cont]);
                nlapiLogExecution('ERROR', 'doc_estado', estado);
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
                    if (estado == 'ERROR') {
                        estado = 'RECHAZADO';
                    }
                    status_doc     = estado;
                    array_mensaje  = infoComfiar_temp.split('mensaje>');
                    var mensaje    = '';
                    var mensaje_id = '';
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

                            mensajeError += 'ID Error * ' + mensaje_id + ' * - ' + mensaje + '\n';
                        }

                        nlapiLogExecution('ERROR', 'doc_mensajeError', mensajeError);
                    }
                    cant_rechazado++;
                }
                nlapiLogExecution('ERROR','Nro Cbte Otros',array_nrCbte[main_id_cont]+'-'+main_id_cont);
                logError(arrayMainID[main_id_cont], TransaccionId, array_nrCbte[main_id_cont], status_doc, mensajeError);
                //logError(arrayMainID[main_id_cont], TransaccionId, nroCbte_init++, status_doc, mensajeError);
                main_id_cont++;
            }
            nlapiLogExecution('ERROR', 'main_id_cont', main_id_cont);
        }
        nlapiLogExecution('ERROR', 'status_doc - mensajeError', status_doc + '- ' + mensajeError);

    nlapiLogExecution('ERROR', 'WSSalidaTransac', 'FIN WSSalidaTransac');

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
            returnUltimoNroCbte = nlapiRequestURL(URL_WS, StringXML, soapHeaders);
        }catch(e){
            nlapiLogExecution('ERROR','CATCH ERROR WSUltimoNroCbte', e);
            var msjCatch = e.valueOf().toString().substring(0,300);
            nlapiLogExecution('ERROR','CATCH ERROR WSUltimoNroCbte MSJCATCH', msjCatch);
            
            var params= new Array();
            var values= new Array();
            params[0]='custrecord_lmry_pe_ei_bm_status';
            params[1]='custrecord_lmry_pe_ei_bm_response';
            params[2]='custrecord_lmry_pe_ei_bm_n_transaction';

            values[0]='Error - ' + TransaccionId;
            values[1]='Error Inesperado al consumir WS Último Nro Comprobante';
            values[2]=parseInt(cantidadTx);

            nlapiSubmitField(LOGRECORD_ID,id_BMlog,params,values);
            
            return 'Error';
        }

        nlapiLogExecution('ERROR','returnUltimoNroCbte', replaceXML(returnUltimoNroCbte.body));

        var UltimoNroCbteResult = returnUltimoNroCbte.body.split('UltimoNumeroComprobanteResult')[1];
        if(UltimoNroCbteResult != null && UltimoNroCbteResult != ''){

            secuencial = UltimoNroCbteResult.substring(1, UltimoNroCbteResult.length-2);
            secuencial++;
            param_numComprobante=secuencial;

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
        
        var coltabla = new Array();
        coltabla[0] =  new nlobjSearchColumn('custrecord_lmry_pe_fel_usuario_ws');
        coltabla[1] =  new nlobjSearchColumn('custrecord_lmry_pe_fel_password_ws');
        coltabla[2] =  new nlobjSearchColumn('custrecord_lmry_pe_fel_url_acceso_ws');
        coltabla[3] =  new nlobjSearchColumn('custrecord_lmry_pe_fel_host_ws');
        coltabla[4] =  new nlobjSearchColumn('custrecord_lmry_pe_ambiente_ws');
        coltabla[5] =  new nlobjSearchColumn('custrecord_lmry_pe_formatoid_ws');

    enabFeatureRecord = nlapiSearchRecord( 'customrecord_lmry_pe_fel_enable_feature'
          , null
          , null
          , coltabla
        );

    if (enabFeatureRecord != null && enabFeatureRecord != '') {

        USER     = enabFeatureRecord[0].getValue('custrecord_lmry_pe_fel_usuario_ws');
        nlapiLogExecution('ERROR', 'USER', USER);
        PASSWORD = enabFeatureRecord[0].getValue('custrecord_lmry_pe_fel_password_ws');
        nlapiLogExecution('ERROR', 'PASSWORD', PASSWORD);
        URL_WS   = enabFeatureRecord[0].getValue('custrecord_lmry_pe_fel_url_acceso_ws');
        nlapiLogExecution('ERROR', 'URL_WS', URL_WS);
        HOST_WS   = enabFeatureRecord[0].getValue('custrecord_lmry_pe_fel_host_ws');
        nlapiLogExecution('ERROR', 'HOST_WS', HOST_WS);
        AMBIENTE_WS   = enabFeatureRecord[0].getValue('custrecord_lmry_pe_ambiente_ws');
        nlapiLogExecution('ERROR', 'AMBIENTE_WS', AMBIENTE_WS);
        FORMATO_WS   = enabFeatureRecord[0].getValue('custrecord_lmry_pe_formatoid_ws');
        nlapiLogExecution('ERROR', 'FORMATO_WS', FORMATO_WS);

    }   
    
    }

    function logError(main_id, TransaccionId, num, status_doc, resp){

        var params= new Array();
        params[0]=TransaccionId;
        params[1]=status_doc;
        if (exito) {
            params[2]='';
        }else{
            params[2]=resp;
        }
        num = "" + num;
        var pad = "00000000";
        num = pad.substring(0, pad.length - num.length) + num;
        params[3]=num;
        var fields= new Array();
        
        fields[0]='custrecord_lmry_pe_ei_id';
        fields[1]='custrecord_lmry_pe_ei_status';
        fields[2]='custrecord_lmry_pe_ei_response';
        fields[3]='custrecord_lmry_pe_ei_preprint_number';

        //log.error("DOCRECORD_ID - main_id", DOCRECORD_ID + " - " + main_id);
        //log.error("params", params);

        try{
            
            nlapiSubmitField(DOCRECORD_ID, main_id, fields, params);
        }catch(e){
            nlapiLogExecution('ERROR','CATCH ERROR logError', e);
            var msjCatch = e.valueOf().toString().substring(0,300);
            nlapiLogExecution('ERROR','CATCH ERROR logError MSJCATCH', msjCatch);

             nlapiLogExecution('ERROR','DOCRECORD_ID - main_id', DOCRECORD_ID + ' - ' + main_id);
             nlapiLogExecution('ERROR','params', params);
            error_log = true;
        }
        
    }

    function mailResumen(){
        
        nlapiScheduleScript('customscript_lmry_pe_ei_bm_mail_schdl','customdeploy_lmry_pe_ei_bm_mail_schdl');
        
        nlapiLogExecution('ERROR','MAIL RESUMEN', 'ENTRO Script');
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
        var f = nlapiStringToDate(fecha);
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
            //fechaOrden = retornaValorFecha(fechaOrden);
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