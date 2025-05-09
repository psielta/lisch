using IniParser;
using IniParser.Model;
using System;
using System.IO;
using System.Runtime.InteropServices;

public class IniFile
{
    private string filePath;
    private IniData data;
    private FileIniDataParser parser;

    public IniFile(string filePath)
    {
        this.filePath = filePath;
        parser = new FileIniDataParser();
        if (File.Exists(filePath))
        {
            data = parser.ReadFile(filePath);
        }
        else
        {
            throw new FileNotFoundException($"INI file not found: {filePath}");
        }
    }

    public void Write(string section, string key, string value)
    {
        if (data[section] == null)
        {
            data.Sections.AddSection(section);
        }

        data[section][key] = value;
        parser.WriteFile(filePath, data);
    }

    public string Read(string section, string key, string defaultValue = "")
    {
        if (data[section] != null && data[section][key] != null)
        {
            return data[section][key];
        }

        return defaultValue;
    }

    public static string GetConnectionString()
    {
        // Verifica se está rodando em Linux ou Windows
        string iniFilePath;
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
        {
            // Se estiver em Linux, usa o caminho do Linux
            iniFilePath = @"/var/www/trx/GoCore/bin/GlobalPostGre.ini";
        }
        else
        {
            // Se estiver em Windows, usa o caminho do Windows
            iniFilePath = $@"C:\Lisch\GlobalPostGre.ini";
        }

        IniFile iniFile = new IniFile(iniFilePath);

        string hostname = iniFile.Read("Banco de Dados", "hostname");
        string database = iniFile.Read("Banco de Dados", "database");
        string port = iniFile.Read("Banco de Dados", "port");
        string user = iniFile.Read("Banco de Dados", "user");
        string password = iniFile.Read("Banco de Dados", "password");

        if (string.IsNullOrEmpty(hostname))
        {
            throw new Exception("Servidor não configurado.");
        }
        if (string.IsNullOrEmpty(database))
        {
            throw new Exception("Banco de dados não configurado.");
        }
        if (string.IsNullOrEmpty(port))
        {
            throw new Exception("Porta não configurada.");
        }
        if (string.IsNullOrEmpty(user))
        {
            throw new Exception("Usuário não configurado.");
        }
        if (string.IsNullOrEmpty(password))
        {
            throw new Exception("Senha não configurada.");
        }

        return $"Host={hostname};Port={port};Database={database};Username={user};Password={password}";
    }

    [DllImport("kernel32")]
    public static extern long WritePrivateProfileString(string section, string key, string val, string filePath);

    [DllImport("kernel32")]
    public static extern int GetPrivateProfileString(string section, string key, string def, byte[] retVal, int size, string filePath);
}
