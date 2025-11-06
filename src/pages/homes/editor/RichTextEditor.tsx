import React, { useCallback, useEffect, useRef } from 'react';
import ReactQuill, { type Value } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '@/styles/rich-text-editor.css';

// 임시 미리보기 이미지의 데이터 형태
interface TempImageFile {
  file: File; // 사용자가 실제로 선택한 이미지 파일
  tempUrl: string; // URL.createObjectURL 로 만든 blob 임시 URL (본문 보여줌)
  id: string; // 관리를 위한 ID 를 할당
}

// 컴포넌트가 외부에서 전달받을 데이터 형태
interface RichTextEditorProps {
  value: string; // 에디터에 초기로 보여줄 내용
  onChange: (value: string) => void; // 내용이 변결될때 실행할 함수
  placeholder?: string; // 안내 텍스트 (선택사항)
  disabled?: boolean; // 에디터를 비활성화할지 여부 (선택사항)
  // 추가됨.
  onImagesChange?: (images: File[]) => void; // 파일을 외부에 보관하는 용도
}

const RichTextEditor = ({
  value,
  onChange,
  placeholder = '내용을 입력하세요.',
  disabled = false,
  onImagesChange, // 외부로 이미지를 전달하는 함수
}: RichTextEditorProps) => {
  // ref 변수들을 저장해둠.
  // ReactQuill 을 보관둡니다.
  const quilRef = useRef<ReactQuill | null>(null);

  // 미리보기 이미지들을 보관할 임시 목록("blob:~~")
  const tempImagesRef = useRef<TempImageFile[]>([]);

  // 가장 최근의 내용을 관리하기 위한 변수
  const valueRef = useRef<string>(value);

  // 임시 이미지 URL 생성하는 기능 (기능을 한번만 만들고 재활용)
  const createTempImageUrl = useCallback((file: File): string => {
    // 웹브라우저 임시 파일 주소 생성
    return URL.createObjectURL(file);
  }, []);

  // React Quill 의  툴바의 파일 추가 (이미지 아이콘 클릭 처리)를 수정
  // 리랜더링시 다시 함수 안만들도록 useCallback 으로 보관
  const imageHandler = useCallback(() => {
    // input 태그를 코딩으로 만들어 낸다.
    // <input type="file" accept = "image/*" onchange="" />
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    // 업데이트 : 여러개 선택 가능
    input.setAttribute('multiple', 'true');
    input.setAttribute('accept', 'image/*');
    input.click();
    input.onchange = async () => {
      // 업데이트 : 최소 1개 이상 파일 선택
      const files = input.files;
      if (!files || files.length === 0) return;

      // 실제 React Quill 내용 창에 출력
      const quill = quilRef.current?.getEditor();
      if (!quill) return;

      // 어디에다가 이미지를 출력할 것인가 위치를 파악
      const range = quill.getSelection();
      // 특정 범위가 없다면 끝에 배치한다.
      let insertIndex = range ? range.index : quill.getLength();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // 파일 크기를 보통 5MB 바이트로 제한
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name}은 이미지 파일 크기는 5MB 이하여야 합니다.`);
          continue; // 이 파일은 건너띄어서 계속 실행
        }
        // 임시 주소 생성
        const tempUrl = createTempImageUrl(file);
        // 절대 중복되지 않는 임시 ID 를 생성하자.
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // 임시 파일 및 주소를 저장
        const tempImage: TempImageFile = {
          file: file,
          tempUrl: tempUrl,
          id: tempId,
        };

        // 생성된 정보를 보관한다.
        tempImagesRef.current.push(tempImage);
        console.log(`이미지가 추가됨 : ${tempId} ${tempUrl}`);

        try {
          // 직접 html 태그를 만들어서 삽입해줌.
          // 나중에 고민 좀 해보자.
          // <p> <img src="" /> </p>
          const img = document.createElement('img');
          img.src = tempUrl;
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
          img.style.display = 'block';
          img.style.margin = '10px 0';

          // 유일한 ID 를 부여해서 추후 비교용으로 활용
          img.setAttribute('data-temp-id', tempId);

          const p = document.createElement('p');
          p.appendChild(img);

          // React Quill 직접 추가
          const editorElement = quill.root;
          // 현재 위치에 추가
          if (insertIndex === 0) {
            // 찾은 root Div 태그에 앞쪽에 추가한다.
            editorElement.insertBefore(p, editorElement.firstElementChild);
          } else {
            const nodes = editorElement.childNodes;

            if (insertIndex < nodes.length) {
              editorElement.insertBefore(p, nodes[insertIndex]);
            } else {
              editorElement.appendChild(p);
            }
          }

          // 다음 이미지를 위해서 입력 위치만 업데이트
          insertIndex++;
        } catch (error) {
          console.log('이미지 삽입 중 오류 : ', error);
          // 오류 이더라도 다시 html 을 추가해 봄.
          try {
            const imgHtml = `<img src=${tempUrl} data-temp-id=${tempId} style="max-width:100%; height:auto; maring: 10px 0;"/>`;
            quill.clipboard.dangerouslyPasteHTML(insertIndex, imgHtml);
            insertIndex++;
          } catch (err) {
            console.log('이미지 삽입 정말 실패 : ', err);
          }
        }
      }

      // 모든 이미지가 배치가 되면 강제렌더링
      quill.update();
      // 마우스 커서 위치 조절
      quill.setSelection(insertIndex);
    };
  }, [createTempImageUrl]);

  // value 변경되면 다시 value 를 보관함.
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // 에디터 내용과 임시 이미지 목록 즉, tempImagesRef 의 변화를 매칭해줌. 동기화
  // 리랜더링 되더라도 한번만 생성되게
  const syncTempImages = useCallback(() => {
    // 현재 에디터 내용에서 사용중인 tempUrl 을 추출함.
    // 데이터 타입에서 Array 처럼 Set 도 있습니다.
    const usedTempUrls = new Set<string>();
    // 내용에서 blob 으로 된 글자를 찾아줄 겁니다.
    // 글자들을 비교할때 정규표현식(Regular Expression)을 사용함.
    const tempUrlRegex = /blob:[^"'\s]+/g;

    // 실제로 비교를 실행
    // const matchs = valueRef.current.match(tempUrlRegex);
    // if (matchs) {
    //   matchs.forEach(item => usedTempUrls.add(item));
    // }

    // 오류개선
    const matchs = valueRef.current.match(tempUrlRegex);

    // 순서대로 표시된 이미지를 재정렬
    const orderdImages: TempImageFile[] = [];
    matchs?.forEach(tempUrl => {
      const foundImage = tempImagesRef.current.find(item => item.tempUrl === tempUrl);
      if (foundImage && !usedTempUrls.has(tempUrl)) {
        orderdImages.push(foundImage);
        usedTempUrls.add(tempUrl);
      }
    });

    // 사용하지 않는 임시 이미지들 정리
    // 메모리 누수를 막아주기 위해서
    // tempImagesRef.current = tempImagesRef.current.filter(item => {
    //   const isUsed = usedTempUrls.has(item.tempUrl);
    //   // 내용에 임시 미리보기 URL 글자가 없다면 삭제해야 한다.
    //   if (!isUsed) {
    //     // 사용하지 않는 blob URL 정리하기
    //     URL.revokeObjectURL(item.tempUrl);
    //   }
    //   return isUsed;
    // });

    // 개선된 코드 : 사용하지 않는 임시 이미지들을 정리
    // 메모리 누수를 막아주기 위해서
    tempImagesRef.current.forEach(item => {
      if (!usedTempUrls.has(item.tempUrl)) {
        // 사용하지 않는 blob url 을 정리하기
        URL.revokeObjectURL(item.tempUrl);
        console.log(`이미지 삭제됨 : ${item.id} ${item.tempUrl}`);
      }
    });
    // 에디터 순서대로 재 정렬된 배열로 업데이트
    tempImagesRef.current = orderdImages;
  }, []);

  // 에디터의 내용이 변경되면 임시 이미지 동기화
  useEffect(() => {
    // 메모리 누수 방지 및 필요없는 파일 업로드 방지용
    syncTempImages();
  }, [value, syncTempImages]);

  // 툴바 설정 - 에디터 상단에 표시될 버튼들을 정의
  const modules = {
    toolbar: [
      // 헤더 옵션: H1, H2, H3, 일반 텍스트
      [{ header: [1, 2, 3, false] }],
      // 텍스트 서식 옵션
      ['bold', 'italic', 'underline', 'strike'],
      // 색상 옵션: 텍스트 색상, 배경 색상
      [{ color: [] }, { background: [] }],
      // 텍스트 정렬 옵션: 왼쪽, 가운데, 오른쪽, 양쪽 정렬
      [{ align: [] }],
      // 목록 옵션: 순서 있는 목록, 순서 없는 목록
      [{ list: 'ordered' }, { list: 'bullet' }],
      // 들여쓰기 옵션: 왼쪽으로 들여쓰기, 오른쪽으로 들여쓰기
      [{ indent: '-1' }, { indent: '+1' }],
      // 링크와 이미지 삽입 옵션
      ['link', 'image'],
      // 서식 제거 옵션: 선택한 텍스트의 모든 서식을 제거
      ['clean'],
    ],
  };

  // 에디터에서 허용할 HTML 태그들을 정의
  // 이 배열에 포함된 태그만 에디터에서 사용할 수 있음
  const formats = [
    'header', // 헤더 태그 (h1, h2, h3)
    'bold', // 굵은 글씨 (strong, b)
    'italic', // 기울임 글씨 (em, i)
    'underline', // 밑줄 (u)
    'strike', // 취소선 (s, del)
    'color', // 텍스트 색상 (span with color)
    'background', // 배경 색상 (span with background-color)
    'align', // 텍스트 정렬 (text-align)
    'list', // 목록 (ul, ol)
    'bullet', // 순서 없는 목록 (ul)
    'indent', // 들여쓰기 (margin-left)
    'link', // 링크 (a)
    'image', // 이미지 (img)
  ];

  // 이미지 파일을 외부로 전달
  useEffect(() => {
    if (onImagesChange) {
      // 실제 화면에 보이는 파일만 배열요소로 추출
      const imageFiles = tempImagesRef.current.map(item => item.file);
      onImagesChange(imageFiles);
    }
  }, [onImagesChange, value]); // 에디터에 내용이 바뀔때마다 이미지 목록 업데이트

  // 에디터가 마운트 되면
  // 즉, 화면에 보이면 이미지 버튼에 이벤트 리스너추가
  useEffect(() => {
    // 약간 시간을 두고 핸들러 등록 (에디터가 초기화 하는 데 시간걸림)
    const timer = setTimeout(() => {
      const quill = quilRef.current?.getEditor();
      if (quill) {
        console.log('Quill 에디터 초기화 성공!');
        const toolbar = quill.getModule('toolbar') as any;
        if (toolbar && toolbar.addHandler) {
          console.log('이미지 핸들러 등록 실행 함');
          // 우리가 원하는 핸들러 등록
          toolbar.addHandler('image', imageHandler);
        }
      }
    }, 100);

    // 클린업 함수
    return () => {
      clearTimeout(timer);
    };
  }, [imageHandler]);

  return (
    <div>
      <ReactQuill
        ref={quilRef} // React Quill 인스턴스를 보관해 둠.
        theme="snow" // 테마
        value={value} // 에디터에 보여줄 내용
        onChange={onChange} // 내용 변경시 실행할 함수
        modules={modules} // 툴바에 기능 설정
        formats={formats} // 허용할 HTML 태그
        placeholder={placeholder} // 안내 글자
        readOnly={disabled} // 읽기 전용 여부
        className="rich-text-editor"
      />
    </div>
  );
};

export default RichTextEditor;
