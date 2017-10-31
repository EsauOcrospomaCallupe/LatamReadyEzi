package Conexion;

import java.io.PrintStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class conectar {
    private String url_odbc = "jdbc:odbc:";
    private String driver = "NSODBC";
    private String url = this.url_odbc + this.driver;
    private Connection con;

    public Connection conexion(String usuario, String password) {
        String[ ] usuario2 = usuario.split("@");       
        if(usuario2[1]=="utec.edu.pe"){
            return false;
        }
        try {
            Class.forName("sun.jdbc.odbc.JdbcOdbcDriver");
            System.out.println("Creación del puente JDBC-ODBC correcta");
        }
        catch (ClassNotFoundException e) {
            System.out.println("Error al crear el puente JDBC-ODBC");
        }
        try {
            this.url = "jdbc:odbc:NSODBC.ADISTEC";
            this.con = DriverManager.getConnection(this.url, usuario, password);
            System.out.println("Se establece conexión correctamente al odbc: " + this.url);
            System.out.println("usuario: " + usuario);
            System.out.println("password: " + password);
        }
        catch (SQLException ex) {
            System.out.println("Error al conectar al odbc: " + this.url);
            try {
                this.url = "jdbc:odbc:NSODBC";
                this.con = DriverManager.getConnection(this.url, usuario, password);
                System.out.println("Se establece conexión correctamente al odbc: " + this.url);
                System.out.println("usuario: " + usuario);
                System.out.println("password: " + password);
            }
            catch (SQLException ex1) {
                try {
                    this.url = "jdbc:odbc:NSODBC-NA";
                    this.con = DriverManager.getConnection(this.url, usuario, password);
                    System.out.println("Se establece conexión correctamente SILVESTRE");
                    System.out.println("usuario: " + usuario);
                    System.out.println("password: " + password);
                }
                catch (SQLException dx) {
                    try {
                        this.url = "jdbc:odbc:NSODBC.PROSAC";
                        this.con = DriverManager.getConnection(this.url, usuario, password);
                        System.out.println("Se establece conexión correctamente PROSAC");
                        System.out.println("usuario: " + usuario);
                        System.out.println("password: " + password);
                    }
                    catch (SQLException fx) {
                        try {
                            this.url = "jdbc:odbc:NSODBC.DUPREE";
                            this.con = DriverManager.getConnection(this.url, usuario, password);
                            System.out.println("Se establece conexión correctamente DUPREE");
                            System.out.println("usuario: " + usuario);
                            System.out.println("password: " + password);
                        }
                        catch (SQLException px) {
                            try {
                                this.url = "jdbc:odbc:NSODBC.PROMOTICK";
                                this.con = DriverManager.getConnection(this.url, usuario, password);
                                System.out.println("Se establece conexión correctamente PROMOTICK");
                                System.out.println("usuario: " + usuario);
                                System.out.println("password: " + password);
                            }
                            catch (SQLException sx) {
                                try {
                                    this.url = "jdbc:odbc:NSODBC.ISEG";
                                    this.con = DriverManager.getConnection(this.url, usuario, password);
                                    System.out.println("Se establece conexión correctamente ISEG");
                                    System.out.println("usuario: " + usuario);
                                    System.out.println("password: " + password);
                                }
                                catch (SQLException ix) {
                                    System.out.println("No se pudo establecer la conexión.. ");
                                    System.out.println("url: " + this.url);
                                    System.out.println("usuario: " + usuario);
                                    System.out.println("password: " + password);
                                    return null;
                                }
                            }
                        }
                    }
                }
            }
        }
        return this.con;
    }

    public boolean closeConecction() {
        try {
            this.con.close();
        }
        catch (SQLException sqle) {
            System.out.println("No se cerro la conexión.. " + sqle);
            return false;
        }
        System.out.println("Conexión cerrada con éxito ");
        return true;
    }

    public ResultSet consultaSubsidiaria(Connection conexion) throws SQLException {
        String seleccion = "select  SUBSIDIARY_ID,  case when legal_name is not null then legal_name else NAME end as NAME,  federal_number from  SUBSIDIARIES WHERE  PARENT_ID IS NOT NULL AND  IS_ELIMINATION = 'No' and  ISINACTIVE='No'";
        PreparedStatement ps = conexion.prepareStatement(seleccion);
        return ps.executeQuery();
    }

    public ResultSet consultaSubsidiariaUnica(Connection conexion) throws SQLException {
        String seleccion = "select SUBSIDIARY_ID, LEGAL_NAME, federal_number from SUBSIDIARIES WHERE IS_ELIMINATION = 'No'";
        PreparedStatement ps = conexion.prepareStatement(seleccion);
        return ps.executeQuery();
    }

    public ResultSet consultaPeriodosFiscales(Connection conexion) throws SQLException {
        String seleccion = "select ACCOUNTING_PERIOD_ID, NAME, ENDING, STARTING, YEAR_ID from ACCOUNTING_PERIODS";
        PreparedStatement ps = conexion.prepareStatement(seleccion);
        return ps.executeQuery();
    }

    public ResultSet consultaPeriodoContableBC(Connection conexion, String cadenaAdicional) throws SQLException {
        System.out.println("paso");
        String seleccion = "select  ACCOUNTING_PERIOD_ID,  NAME,  ENDING,  STARTING from  ACCOUNTING_PERIODS where quarter = 'No' and TO_CHAR(STARTING,'DD-MM')!= TO_CHAR(ENDING,'DD-MM')" + cadenaAdicional + " order by 4";
        System.out.println("QUERY: " + seleccion);
        PreparedStatement ps = conexion.prepareStatement(seleccion);
        return ps.executeQuery();
    }

    public ResultSet consultaPeriodoContable(Connection conexion, String cadenaAdicional) throws SQLException {
        String seleccion = "select  ACCOUNTING_PERIOD_ID,  NAME,  ENDING,  STARTING from  ACCOUNTING_PERIODS where quarter = 'No' " + cadenaAdicional + " order by 4";
        System.out.println("QUERY: " + seleccion);
        PreparedStatement ps = conexion.prepareStatement(seleccion);
        return ps.executeQuery();
    }

    public ResultSet consultaTipoTransaccion(Connection conexion) throws SQLException {
        String seleccion = "select distinct TRANSACTION_TYPE from transactions order by 1";
        PreparedStatement ps = conexion.prepareStatement(seleccion);
        return ps.executeQuery();
    }

    public ResultSet consultaDatosUsuario(Connection conexion, String mail) throws SQLException {
        String seleccion = "select NAME from employees where email = '" + mail + "'";
        PreparedStatement ps = conexion.prepareStatement(seleccion);
        return ps.executeQuery();
    }

    public ResultSet consultaDatosEmpresa(Connection conexion, String subsidiaria) throws SQLException {
        String seleccion = "select case when LEGAL_NAME is not null then LEGAL_NAME else NAME end, federal_number from SUBSIDIARIES WHERE IS_ELIMINATION = 'No' and SUBSIDIARY_ID='" + subsidiaria + "'";
        PreparedStatement ps = conexion.prepareStatement(seleccion);
        return ps.executeQuery();
    }

    public ResultSet consultaDatosEmpresaSinSubsidiaria(Connection conexion) throws SQLException {
        String seleccion = "select LEGAL_NAME, federal_number from SUBSIDIARIES ";
        PreparedStatement ps = conexion.prepareStatement(seleccion);
        return ps.executeQuery();
    }

    public ResultSet consultaPaisEmpresa(Connection conexion, String subsidiaria) throws SQLException {
        String seleccion = "select COUNTRY from NEXUS where nexus_id in (select NEXUS_ID from SUBSIDIARY_NEXUS_MAP where subsidiary_id = '" + subsidiaria + "') " + "and is_inactive='No'";
        PreparedStatement ps = conexion.prepareStatement(seleccion);
        return ps.executeQuery();
    }

    public ResultSet consultaAccesoReportes(Connection conexion, String subsidiaria) throws SQLException {
        String seleccion = "select REPORTES_ODBC_NAME, ARCHIVO_JASPER_REPORTE_ODBC from reportes_odbc where IS_INACTIVE ='F' AND SUBSIDIARIA_REPORTE_ODBC_ID = '" + subsidiaria + "' " + "order by 1";
        if (subsidiaria.compareTo("") == 0 || subsidiaria == null) {
            seleccion = "select REPORTES_ODBC_NAME, ARCHIVO_JASPER_REPORTE_ODBC from reportes_odbc where IS_INACTIVE ='F' order by 1";
        }
        PreparedStatement ps = conexion.prepareStatement(seleccion);
        return ps.executeQuery();
    }

    public ResultSet ejecutaConsultaLibroElectronico(Connection conexion, String stringQuery) throws SQLException {
        PreparedStatement ps = conexion.prepareStatement(stringQuery);
        return ps.executeQuery();
    }

    public ResultSet consultaAccesoReportesSinSubsidiaria(Connection conexion) throws SQLException {
        String seleccion = "select REPORTES_ODBC_NAME, ARCHIVO_JASPER_REPORTE_ODBC from reportes_odbc where IS_INACTIVE ='F' order by 1";
        PreparedStatement ps = conexion.prepareStatement(seleccion);
        return ps.executeQuery();
    }

    public ResultSet obtenerTipoDeCambio(Connection conexion, String rangoFinal) throws SQLException {
        String seleccion = "select CURRENCY_ID, EXCHANGE_RATE, DATE_EFFECTIVE, DATE_LAST_MODIFIED from currencyrates A where A.CURRENCY_ID in (select CURRENCY_ID     from(         select             CURRENCY_ID, max(date_effective) maximofecha         from currencyrates         where date_effective <= date('" + rangoFinal + "') " + "        group by CURRENCY_ID " + "        )" + ") " + "and A.DATE_EFFECTIVE in " + "(select maximofecha " + "    from( " + "         select " + "            CURRENCY_ID, max(date_effective) maximofecha " + "        from currencyrates " + "        where date_effective <= date('" + rangoFinal + "') " + "        group by CURRENCY_ID " + "    ) " + ") order by 1,3 desc,4 desc";
        PreparedStatement ps = conexion.prepareStatement(seleccion);
        return ps.executeQuery();
    }

    public ResultSet listaItems(Connection conexion, String idSubsidiaria) throws SQLException {
        String seleccion = "select     d.ITEM_ID,    d.displayname,     d.NAME as nombreItem from     transactions a     inner join transaction_lines b on (b.transaction_id = a.transaction_id)     inner join items d on (d.item_id = b.item_id and d.asset_account_id = b.account_id) where     a.transaction_type!='Orden de trabajo'     and b.SUBSIDIARY_ID = '" + idSubsidiaria + "' " + "    and d.ISINACTIVE = 'No' " + "group by " + "    d.ITEM_ID, d.displayname, d.NAME " + "order by 3";
        System.out.println("QUERY LISTA ITEMS " + seleccion);
        PreparedStatement ps = conexion.prepareStatement(seleccion);
        return ps.executeQuery();
    }

    public ResultSet DatosItem(Connection conexion, String ItemID) throws SQLException {
        String seleccion = "select     b.name, a.displayname, a.NAME,     c.tipo_de_existencia_sunat_name, d.codigo_de_unidad_medida_sun_na from      items a     inner join locations b on (b.location_id = a.location_id)     inner join tipo_de_existencia_sunat c on (c.tipo_de_existencia_sunat_id = a.tipo_de_existencia_sunat_id)     inner join codigo_de_unidad_medida_sunat d on (d.codigo_de_unidad_medida_sun_id = a.codigo_unidad_de_medida_sun_id) where item_id='" + ItemID + "'";
        PreparedStatement ps = conexion.prepareStatement(seleccion);
        return ps.executeQuery();
    }

    public ResultSet obtenerPrimerDatoKardex(Connection conexion, String itemId, String rangoInicial) throws SQLException {
        String query = "select     sum(b.item_count) as CANTIDAD,     sum(b.amount) AS MONTO from     transactions a     inner join transaction_lines b on (b.transaction_id = a.transaction_id)     inner join accounting_periods c on (c.accounting_period_id = a.ACCOUNTING_PERIOD_ID)     left outer join tipo_de_operacion_sunat d on (d.tipo_de_operacion_sunat_id=a.TIPO_DE_OPERACION_SUNAT_ID)     left outer join tipo_de_comprobante_sunat e on (e.tipo_de_comprobante_sunat_id=a.tipo_de_guia_DE_remision_id)     left outer join series_de_impresion f on (f.series_de_impresion_id=a.serie_guia_id)     inner join items g on (g.item_id = b.item_id and g.asset_account_id = b.account_id)     inner join accounting_periods h on (h.accounting_period_id = a.accounting_period_id) where     b.item_id = '" + itemId + "' " + "    and c.ENDING < DATE('" + rangoInicial + "') " + "    and a.transaction_type!='Orden de trabajo'";
        PreparedStatement ps = conexion.prepareStatement(query);
        return ps.executeQuery();
    }

    public ResultSet listaItemCantidades(Connection conexion) throws SQLException {
        String seleccion = "select    b.item_id,    sum(b.item_count) as CANTIDAD,    sum(b.amount) AS MONTO from    transactions a    inner join transaction_lines b on (b.transaction_id = a.transaction_id)    inner join accounting_periods c on (c.accounting_period_id = a.ACCOUNTING_PERIOD_ID) where    c.ENDING < DATE('01-12-2012')    and a.transaction_type!='Orden de trabajo' group by b.item_id";
        PreparedStatement ps = conexion.prepareStatement(seleccion);
        return ps.executeQuery();
    }

    public ResultSet libroMayorMontosIniciales(Connection conexion, String subsidiaria, String periodo) throws SQLException {
        String query = "SELECT MAIN2.ACCOUNT_ID, MAIN2.NOMBRE, MAIN2.MONTOINICIAL FROM (SELECT MAIN.ACCOUNT_ID, MAIN.NOMBRE, SUM(MAIN.amountPeriodo) AS MONTOPERIODO, SUM(MAIN.amountAntesPeriodo) AS MONTOINICIAL from (SELECT    C.ACCOUNT_ID,    case when c.accountnumber is not null     then c.accountnumber +' - '+ c.NAME     else c.NAME END AS NOMBRE,     case when T.ACCOUNTING_PERIOD_ID = '" + periodo + "' then sum(TL.amount) else 0 end as amountPeriodo, " + "    case when T.ACCOUNTING_PERIOD_ID < '" + periodo + "' then sum(TL.amount) else 0 end as amountAntesPeriodo " + "FROM " + "    TRANSACTIONS T " + "    LEFT JOIN TRANSACTION_LINES TL ON T.TRANSACTION_ID = TL.TRANSACTION_ID " + "    LEFT JOIN ACCOUNTS c ON c.ACCOUNT_ID = TL.ACCOUNT_ID " + "    LEFT OUTER JOIN CODIGO_DE_LIBRO_SUNAT CLS ON T.COD_LIBRO_SUNAT = CLS.CODIGO_LIBRO_SUNAT " + "    LEFT JOIN ENTITY E ON T.ENTITY_ID = E.ENTITY_ID" + "    LEFT JOIN VENDORS V ON V.VENDOR_ID = E.ENTITY_ID" + "    LEFT JOIN CUSTOMERS CU ON CU.CUSTOMER_ID = E.ENTITY_ID" + "    LEFT JOIN LOCATIONS L ON TL.LOCATION_ID = L.LOCATION_ID" + "    LEFT JOIN DEPARTMENTS D ON TL.DEPARTMENT_ID = D.DEPARTMENT_ID" + "    LEFT JOIN CLASSES C ON TL.CLASS_ID = C.CLASS_ID" + "    LEFT JOIN SUBSIDIARIES S ON TL.SUBSIDIARY_ID = S.SUBSIDIARY_ID" + "    LEFT JOIN ACCOUNTING_PERIODS AP ON T.ACCOUNTING_PERIOD_ID = AP.ACCOUNTING_PERIOD_ID " + "where " + "    TL.subsidiary_id = '" + subsidiaria + "' and" + "    T.ACCOUNTING_PERIOD_ID <= '" + periodo + "'" + "    and TL.non_posting_line !='Yes' " + "group by " + "    C.ACCOUNT_ID,c.accountnumber, c.name, T.ACCOUNTING_PERIOD_ID) as MAIN " + "group by MAIN.ACCOUNT_ID, MAIN.NOMBRE) as MAIN2" + " WHERE MAIN2.MONTOPERIODO != 0" + " ORDER BY 2";
        PreparedStatement ps = conexion.prepareStatement(query);
        return ps.executeQuery();
    }

    public ResultSet kardexDatosBaseItem(Connection conexion, String itemId, String rangoInicial) throws SQLException {
        String sql = "select     f.name as Name1, d.displayname, d.NAME as Name2,    g.tipo_de_existencia_sunat_name, h.codigo_de_unidad_medida_sun_na,    sum(b.item_count) as CANTIDAD,    sum(b.amount) AS MONTO from    transactions a    inner join transaction_lines b on (b.transaction_id = a.transaction_id)    inner join accounting_periods c on (c.accounting_period_id = a.ACCOUNTING_PERIOD_ID)    inner join items d on (d.item_id = b.item_id and d.asset_account_id = b.account_id)    inner join accounting_periods e on (e.accounting_period_id = a.accounting_period_id)    inner join locations f on (f.location_id = d.location_id)    inner join tipo_de_existencia_sunat g on (g.tipo_de_existencia_sunat_id = d.tipo_de_existencia_sunat_id)    inner join codigo_de_unidad_medida_sunat h on (h.codigo_de_unidad_medida_sun_id = d.codigo_unidad_de_medida_sun_id) where     b.item_id = '" + itemId + "'" + "    and c.ENDING < DATE('" + rangoInicial + "')" + "    and a.transaction_type!='Orden de trabajo' " + "group by" + "    f.name, d.displayname, d.NAME," + "    g.tipo_de_existencia_sunat_name, h.codigo_de_unidad_medida_sun_na";
        System.out.println(sql);
        PreparedStatement ps = conexion.prepareStatement(sql);
        return ps.executeQuery();
    }

    public ResultSet listaCuentaBancarias(Connection conexion, String tipoEEFF) throws SQLException {
        String seleccion = "select     A.NAME, A.ACCOUNTNUMBER, A.ACCOUNT_ID, A.NRO_CUENTA_BANCARIA,     C.CODIGO_TIPO_MONEDA_SUNAT, D.CODIGO_TIPO_CUENTA_BCP + D.TIPO_DE_CUENTA_BCP_NAME from     accounts A    LEFT OUTER JOIN ENTIDAD_FINANCIERA_SUNAT B ON (B.ENTIDAD_FINANCIERA_SUNAT_ID = A.ENTIDAD_FINANCIERA_SUNAT_ID)    LEFT OUTER JOIN TIPO_DE_MONEDA_SUNAT C ON (C.TIPO_DE_MONEDA_SUNAT_ID = A.TIPO_DE_MONEDA_SUNAT_ID)    LEFT OUTER JOIN TIPO_DE_CUENTA_BCP D ON (D.TIPO_DE_CUENTA_BCP_ID = A.TIPO_DE_CUENTA_ID) WHERE    B.CODIGO_ENTIDAD_FINANCIERA_SUN = '" + tipoEEFF + "'";
        System.out.println(seleccion);
        PreparedStatement ps = conexion.prepareStatement(seleccion);
        return ps.executeQuery();
    }

    public ResultSet seriesComprobanteRetencion(Connection conexion) throws SQLException {
        String seleccion = "select     SERIE_COMPROBANTE_RETENCION_ID, SERIE_COMPROBANTE_RETENCION_NA,    NRO__AUTORIZACIN, FECHA_DE_INICIO_VIGENCIA from SERIE_COMPROBANTE_RETENCION";
        PreparedStatement ps = conexion.prepareStatement(seleccion);
        return ps.executeQuery();
    }

    public ResultSet detalleComprobanteRetencion(Connection conexion, String idSerie, String idProveedor) throws SQLException {
        String lineaProveedor = " and A.ENTITY_ID = '" + idProveedor + "' ";
        if (idProveedor == null || idProveedor.compareTo("0") == 0) {
            lineaProveedor = "";
        }
        String seleccion = "select    A.TRANSACTION_ID,    B.COMPANYNAME,    B.VAT_REG_NUMBER_ODBC,    A.EXCHANGE_RATE,    A.TRANDATE,    C.SERIE_COMPROBANTE_RETENCION_NA,    nvl(A.NMERO_COMPROBANTE_RETENCIN,'0'),    A.ENTITY_ID from     TRANSACTIONS A    inner join VENDORS B on (B.VENDOR_ID = A.ENTITY_ID)    INNER join SERIE_COMPROBANTE_RETENCION C ON (C.SERIE_COMPROBANTE_RETENCION_ID = A.SERIE_IMPRESIN_RETENCIN_ID) where    A.SERIE_IMPRESIN_RETENCIN_ID = '" + idSerie + "'" + lineaProveedor + "    order by A.NMERO_COMPROBANTE_RETENCIN";
        System.out.println(seleccion);
        PreparedStatement ps = conexion.prepareStatement(seleccion);
        return ps.executeQuery();
    }

    public ResultSet detalleComprobanteRetencionPorFecha(Connection conexion, String idSerie, String fecha1, String fecha2, String idProveedor) throws SQLException {
        String lineaProveedor = " and A.ENTITY_ID = '" + idProveedor + "' ";
        if (idProveedor == null || idProveedor.compareTo("0") == 0) {
            lineaProveedor = "";
        }
        String seleccion = "select    A.TRANSACTION_ID,    B.COMPANYNAME,    B.VAT_REG_NUMBER_ODBC,    A.EXCHANGE_RATE,    A.TRANDATE,    C.SERIE_COMPROBANTE_RETENCION_NA,    nvl(A.NMERO_COMPROBANTE_RETENCIN,'0'),     A.ENTITY_ID from     TRANSACTIONS A    inner join VENDORS B on (B.VENDOR_ID = A.ENTITY_ID)    INNER join SERIE_COMPROBANTE_RETENCION C ON (C.SERIE_COMPROBANTE_RETENCION_ID = A.SERIE_IMPRESIN_RETENCIN_ID) where    A.SERIE_IMPRESIN_RETENCIN_ID = '" + idSerie + "'" + "    and A.TRANDATE BETWEEN '" + fecha1 + "' and '" + fecha2 + "'" + lineaProveedor + "    order by A.NMERO_COMPROBANTE_RETENCIN";
        System.out.println(seleccion);
        PreparedStatement ps = conexion.prepareStatement(seleccion);
        return ps.executeQuery();
    }
}