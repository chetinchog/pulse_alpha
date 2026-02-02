package config

import (
	"strings"

	"github.com/spf13/viper"
)

type Config struct {
	Server   ServerConfig
	Ollama   OllamaConfig
	Database DatabaseConfig
}

type ServerConfig struct {
	Port string
	Mode string // debug, release
}

type OllamaConfig struct {
	Enabled bool
	URL     string
	Model   string
}

type DatabaseConfig struct {
	URL string
}

func Load() (*Config, error) {
	viper.SetDefault("server.port", "8080")
	viper.SetDefault("server.mode", "debug")
	viper.SetDefault("ollama.enabled", true)
	viper.SetDefault("ollama.url", "http://localhost:11434")
	viper.SetDefault("ollama.model", "mistral:7b")

	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()

	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		return nil, err
	}
	return &cfg, nil
}
