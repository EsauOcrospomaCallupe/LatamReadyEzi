<#setting locale="en_US">
<#setting number_format="#.##">
<#assign valor = 0>
<#assign cont = 1>
<#assign currency = transaction.currency.symbol>
<#assign descTotal = transaction.custbody_lmry_total_discount_einvoice?c?number>
<?xml version="1.0" encoding="ISO-8859-1" standalone="no"?>
<Comprobantes>
<Comprobante>
<informacionOrganismo>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:ccts="urn:un:unece:uncefact:documentation:2" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2" xmlns:qdt="urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2" xmlns:sac="urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1" xmlns:udt="urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<ext:UBLExtensions>
<ext:UBLExtension>
<ext:ExtensionContent>
<sac:AdditionalInformation>
<sac:AdditionalMonetaryTotal>
<cbc:ID>1001</cbc:ID>
<cbc:PayableAmount currencyID="${currency}">-MONTO1001-</cbc:PayableAmount>
</sac:AdditionalMonetaryTotal>
<sac:AdditionalMonetaryTotal>
<cbc:ID>1002</cbc:ID>
<cbc:PayableAmount currencyID="${currency}">-MONTO1002-</cbc:PayableAmount>
</sac:AdditionalMonetaryTotal>
<sac:AdditionalMonetaryTotal>
<cbc:ID>1003</cbc:ID>
<cbc:PayableAmount currencyID="${currency}">-MONTO1003-</cbc:PayableAmount>
</sac:AdditionalMonetaryTotal>
<sac:AdditionalMonetaryTotal>
<cbc:ID>2005</cbc:ID>
<cbc:PayableAmount currencyID="${currency}">${descTotal?string["#.##"]}</cbc:PayableAmount>
</sac:AdditionalMonetaryTotal>
<sac:AdditionalProperty>
<cbc:ID>1000</cbc:ID>
<cbc:Value>${transaction.custbody_monto_letras_pa}</cbc:Value>
</sac:AdditionalProperty>
</sac:AdditionalInformation>
</ext:ExtensionContent>
</ext:UBLExtension>
</ext:UBLExtensions>
<cbc:UBLVersionID>2.0</cbc:UBLVersionID>
<cbc:CustomizationID>1.0</cbc:CustomizationID>
<cbc:ID>-NUMERACION-${transaction.custbody_lmry_serie_doc_cxc + "-" + transaction.custbody_lmry_num_preimpreso}-NUMERACION-</cbc:ID>
<cbc:IssueDate>${transaction.trandate}</cbc:IssueDate>
<cbc:InvoiceTypeCode>${transaction.custbody_lmry_document_type.custrecord_lmry_codigo_doc}</cbc:InvoiceTypeCode>
<cbc:DocumentCurrencyCode>${currency}</cbc:DocumentCurrencyCode>
<#if transaction.custbody_lmry_ref_guia_numero != ''>
<cac:DespatchDocumentReference>
<cbc:ID>${transaction.custbody_lmry_ref_guia_numero}</cbc:ID>
<cbc:DocumentTypeCode>09</cbc:DocumentTypeCode>
</cac:DespatchDocumentReference>
</#if>
<cac:AccountingSupplierParty>
<!--transaction.subsidiary.taxidnum-->
<cbc:CustomerAssignedAccountID>${transaction.subsidiary.taxidnum}</cbc:CustomerAssignedAccountID>
<cbc:AdditionalAccountID>${transaction.subsidiary.custrecord_tipo_doc_id_sunat_id}</cbc:AdditionalAccountID>
<cac:Party>
<!-- legalname -->
<cac:PartyName>
<cbc:Name>${transaction.subsidiary.legalname}</cbc:Name>
</cac:PartyName>
<cac:PostalAddress>
<cbc:ID>-UBIGEO-</cbc:ID>
<cbc:StreetName>${transaction.subsidiary.address1}</cbc:StreetName>
<cbc:CityName>${transaction.subsidiary.city}</cbc:CityName>
<cbc:CountrySubentity>${transaction.subsidiary.state}</cbc:CountrySubentity>
<cbc:District>${transaction.subsidiary.address2}</cbc:District>
<cac:Country>
<cbc:IdentificationCode>PE</cbc:IdentificationCode>
</cac:Country>
</cac:PostalAddress>
<cac:PartyLegalEntity>
<cbc:RegistrationName>${transaction.subsidiary.legalname}</cbc:RegistrationName>
</cac:PartyLegalEntity>
</cac:Party>
</cac:AccountingSupplierParty>
<cac:AccountingCustomerParty>
<cbc:CustomerAssignedAccountID>${customer.vatregnumber}</cbc:CustomerAssignedAccountID>
<cbc:AdditionalAccountID>${customer.custentity_tipo_doc_id_sunat.custrecord_tipo_doc_id}</cbc:AdditionalAccountID>
<cac:Party>
<cac:PhysicalLocation>
<cbc:Description>${customer.billaddr1}</cbc:Description>
</cac:PhysicalLocation>
<cac:PartyLegalEntity>
<cbc:RegistrationName>${customer.companyname}</cbc:RegistrationName>
</cac:PartyLegalEntity>
</cac:Party>
</cac:AccountingCustomerParty>
<cac:TaxTotal>
<cbc:TaxAmount currencyID="${currency}">${transaction.taxtotal?c?number?string["#.##"]}</cbc:TaxAmount>
<cac:TaxSubtotal>
<cbc:TaxAmount currencyID="${currency}">${transaction.taxtotal?c?number?string["#.##"]}</cbc:TaxAmount>
<cac:TaxCategory>
<cac:TaxScheme>
<cbc:ID>1000</cbc:ID>
<cbc:Name>IGV</cbc:Name>
<cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
</cac:TaxScheme>
</cac:TaxCategory>
</cac:TaxSubtotal>
</cac:TaxTotal>
<cac:LegalMonetaryTotal>
<cbc:PayableAmount currencyID="${currency}">${transaction.total?c?number?string["#.##"]}</cbc:PayableAmount>
</cac:LegalMonetaryTotal>
<#list transaction.item as item>
<#if item.amount \gt 0>
<cac:InvoiceLine>
<cbc:ID>${cont}</cbc:ID>
<#assign cont = cont + 1>
<cbc:InvoicedQuantity unitCode="NIU">${item.quantity?c?number?string["#.###"]}</cbc:InvoicedQuantity>
<cbc:LineExtensionAmount currencyID="${currency}">-MONTOLINEA-${item.amount?c?number?string["#.##"]}-MONTOLINEA-</cbc:LineExtensionAmount>
<cac:PricingReference>
<cac:AlternativeConditionPrice>
<#assign precUnit = item.rate + item.rate*item.taxrate1?c?number>
<!-- ${precUnit} -->
<cbc:PriceAmount currencyID="${currency}">${precUnit?c?number?string["#.##"]}</cbc:PriceAmount>
<cbc:PriceTypeCode>01</cbc:PriceTypeCode>
</cac:AlternativeConditionPrice>
</cac:PricingReference>
<#if item.custcol_lmry_col_sales_discount?c?number \gt 0>
<cac:AllowanceCharge>
<cbc:ChargeIndicator>false</cbc:ChargeIndicator>
<cbc:Amount currencyID="${currency}">${item.custcol_lmry_col_sales_discount?c?number?string["#.##"]}</cbc:Amount>
</cac:AllowanceCharge>
</#if>
<!-- TAXRATE : ${item.taxrate1} - ${item.taxrate1?c?number} -->
<cac:TaxTotal>
<cbc:TaxAmount currencyID="${currency}">${item.tax1amt?c?number?string["#.##"]}</cbc:TaxAmount>
<cac:TaxSubtotal>
<cbc:TaxAmount currencyID="${currency}">${item.tax1amt?c?number?string["#.##"]}</cbc:TaxAmount>
<cac:TaxCategory>
<cbc:TaxExemptionReasonCode>-COD-${item.taxcode}-COD-</cbc:TaxExemptionReasonCode>
<cac:TaxScheme>
<cbc:ID>1000</cbc:ID>
<cbc:Name>IGV</cbc:Name>
<cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
</cac:TaxScheme>
</cac:TaxCategory>
</cac:TaxSubtotal>
</cac:TaxTotal>
<cac:Item>
<cbc:Description>${item.description}</cbc:Description>
<cac:SellersItemIdentification>
<cbc:ID>${item.item}</cbc:ID>
</cac:SellersItemIdentification>
</cac:Item>
<cac:Price>
<cbc:PriceAmount currencyID="${currency}">${item.rate?c?number?string["#.##"]}</cbc:PriceAmount>
</cac:Price>
</cac:InvoiceLine>
</#if>
</#list>
</Invoice>
<TextosLibres>
<TextoLibre1>${transaction.otherrefnum}</TextoLibre1>
<TextoLibre2>${transaction.custbody_lmry_ref_guia_numero}</TextoLibre2>
<TextoLibre3>${transaction.terms}</TextoLibre3>
<TextoLibre4>${transaction.message}</TextoLibre4>
</TextosLibres>
</informacionOrganismo>
</Comprobante>
</Comprobantes>