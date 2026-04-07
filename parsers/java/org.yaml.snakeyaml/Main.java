import org.yaml.snakeyaml.Yaml;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

public final class Main {
    public static void main(String[] args) {
        if (args.length != 1 && args.length != 2) {
            System.err.println("usage: yt <yaml-file> [key]");
            System.exit(1);
        }

        var filePath = Path.of(args[0]);

        Object loaded;

        try (var input = Files.newInputStream(filePath)) {
            var yaml = new Yaml();
            loaded = yaml.load(input);
        } catch (IOException e) {
            System.err.println(e.getMessage());
            System.exit(1);
            return;
        } catch (Exception e) {
            System.err.println(e.getMessage());
            System.exit(2);
            return;
        }

        if (args.length == 1) {
            System.out.println(loaded);
            return;
        }

        var key = args[1];

        if (!(loaded instanceof Map<?, ?> map) || !map.containsKey(key)) {
            System.out.println("<nil>");
            return;
        }

        System.out.println(map.get(key));
    }
}
