#!/usr/bin/env ruby
require 'yaml'

if ARGV.length != 2
  $stderr.puts "usage: yt <yaml-file> <key>"
  puts "ERROR"
  exit 0
end

begin
  data = YAML.safe_load(File.read(ARGV[0]))
  key = ARGV[1]
  if !data.is_a?(Hash) || !data.key?(key)
    puts "absent"
  else
    puts data[key]
  end
rescue Psych::Exception => e
  $stderr.puts e.message
  puts "PARSE_ERROR"
rescue => e
  $stderr.puts e.message
  puts "ERROR"
end
