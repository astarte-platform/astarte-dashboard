import React, { useCallback } from 'react';
import MonacoEditor from '@monaco-editor/react';

interface JsonEditorProps {
  resource: {};
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const JsonEditor: React.FC<JsonEditorProps> = React.memo(({ resource, value, onChange }) => {
  const handleChange = useCallback(
    (newValue: any) => {
      const e = { target: { value: newValue } } as React.ChangeEvent<HTMLInputElement>;
      onChange(e);
    },
    [onChange],
  );

  const handleEditorMount = (editor: any, monaco: any) => {
    if (monaco) {
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas: [
          {
            fileMatch: ['*'],
            schema: resource,
            uri: '',
          },
        ],
      });

      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({ strict: true });

      monaco.languages.registerCompletionItemProvider('json', {
        provideCompletionItems: (
          model: {
            getValueInRange: (arg0: {
              startLineNumber: any;
              startColumn: number;
              endLineNumber: any;
              endColumn: any;
            }) => any;
          },
          position: { lineNumber: any; column: any },
        ) => {
          const textUntilPosition = model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          });

          if (!/\"type\"\s*:\s*\"?$/.test(textUntilPosition)) {
            return { suggestions: [] };
          }

          return { suggestions: [] };
        },
      });
    }
  };

  return (
    <MonacoEditor
      language="json"
      value={value}
      onChange={handleChange}
      options={{
        theme: 'light',
        quickSuggestions: true,
        suggestOnTriggerCharacters: true,
      }}
      onMount={handleEditorMount}
    />
  );
});

export default JsonEditor;
